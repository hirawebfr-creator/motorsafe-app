/**
 * API Route: Purchase Pack (SIV / Storage)
 * 
 * Creates a Stripe checkout session for purchasing credit packs.
 */

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { getStripe } from "@/lib/stripe";
import { SIV_PACKS, STORAGE_PACKS } from "@/lib/stripe-products";
import { requirePermission, Permission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanEnv(val: string | undefined): string | undefined {
  return val?.replace(/\\r\\n$/, "").replace(/\r\n$/, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Only OWNER/MANAGER can purchase
    await requirePermission(user, Permission.BILLING_MANAGE);

    if (user.role === "ADMIN") {
      throw new RouteError(400, "BAD_REQUEST", "Un compte tenant est requis.");
    }

    const garageId = user.garageId;
    if (!garageId) throw new RouteError(400, "TENANT_REQUIRED", "Garage invalide.");

    const body = await req.json().catch(() => ({}));
    const { packId } = body;

    if (!packId) {
      throw new RouteError(400, "INVALID_REQUEST", "packId requis");
    }

    // Find the pack
    const allPacks = [...SIV_PACKS, ...STORAGE_PACKS];
    const pack = allPacks.find(p => p.id === packId);
    
    if (!pack) {
      throw new RouteError(400, "INVALID_PACK", `Pack introuvable: ${packId}`);
    }

    const appUrl = cleanEnv(process.env.APP_URL);
    if (!appUrl) throw new RouteError(500, "CONFIG", "APP_URL manquant");

    const stripe = getStripe();

    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: { 
        id: true, 
        name: true, 
        stripeCustomerId: true,
      },
    });
    if (!garage) throw new RouteError(404, "NOT_FOUND", "Garage introuvable");

    let customerId = garage.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: garage.name,
        metadata: { garageId: String(garage.id) },
      });
      customerId = customer.id;

      await prisma.garage.update({
        where: { id: garage.id },
        data: { stripeCustomerId: customerId },
        select: { id: true },
      });
    }

    // Create checkout session for one-time purchase
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product: pack.productId,
            unit_amount: pack.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/billing?pack_success=true&pack_id=${packId}`,
      cancel_url: `${appUrl}/billing?pack_cancelled=true`,
      metadata: { 
        garageId: String(garage.id),
        packId: pack.id,
        packType: pack.type,
        packAmount: String(pack.amount),
      },
    });

    if (!session.url) throw new RouteError(500, "STRIPE", "Checkout session sans URL");

    return NextResponse.json({ 
      ok: true,
      url: session.url,
      pack: {
        id: pack.id,
        name: pack.name,
        type: pack.type,
        amount: pack.amount,
        price: pack.price,
      },
    });
  } catch (err) {
    console.error("Erreur API POST /api/billing/purchase-pack:", err);
    return toErrorResponse(err);
  }
}
