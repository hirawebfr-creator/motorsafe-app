import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireActiveSubscription, requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    requireActiveSubscription(user);

    const { id: documentId } = await ctx.params;

    if (!documentId) {
      return NextResponse.json(failure("ID requis"), { status: 400 });
    }

    // Get all signature requests for this intervention
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: {
        documentId,
        garageId: user.role === "ADMIN" ? undefined : (user.garageId ?? -1),
        documentType: { in: ["INTERVENTION_ORDER", "INTERVENTION_DELIVERY", "INTERVENTION_DOSSIER"] },
      },
      include: {
        events: { orderBy: { at: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build signing URLs
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

    const result = signatureRequests.map((sr) => ({
      id: sr.id,
      documentType: sr.documentType,
      status: sr.status,
      token: sr.token,
      signingUrl: `${appUrl}/sign/${sr.token}`,
      expiresAt: sr.expiresAt,
      signerEmail: sr.signerEmail,
      signerNameDeclared: sr.signerNameDeclared,
      signedAt: sr.signedAt,
      lastViewedAt: sr.lastViewedAt,
      createdAt: sr.createdAt,
      pdfHash: sr.pdfHash,
      events: sr.events.map((e) => ({
        type: e.type,
        at: e.at,
        ip: e.ip,
      })),
    }));

    return NextResponse.json(success(result));
  } catch (err) {
    console.error("Error GET /api/interventions/[id]/signatures:", err);
    return toErrorResponse(err);
  }
}
