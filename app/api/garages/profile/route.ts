import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/garages/profile
// Returns the current garage's profile (branding info)
// ============================================================

export async function GET(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    if (!user.garageId) {
      throw new RouteError(400, "TENANT_REQUIRED", "Garage non trouvé");
    }

    const garage = await prisma.garage.findUnique({
      where: { id: user.garageId },
      select: {
        id: true,
        name: true,
        displayName: true,
        legalName: true,
        siret: true,
        email: true,
        phone: true,
        address: true,
        addressLine1: true,
        addressLine2: true,
        postalCode: true,
        city: true,
        country: true,
        logoKey: true,
        partnerBadgeEnabled: true,
        partnerBadgeAdminOverride: true,
        publicProfileEnabled: true,
        publicPhone: true,
        publicWebsite: true,
        referralCode: true,
        referralRewardMonths: true,
      },
    });

    if (!garage) {
      throw new RouteError(404, "NOT_FOUND", "Garage non trouvé");
    }

    // Compute logoUrl from logoKey
    const logoUrl = garage.logoKey ? `/api/uploads/file/${garage.logoKey}` : null;

    // Compute effective partner badge status
    const partnerBadgeEffective =
      garage.partnerBadgeAdminOverride === "FORCE_ON"
        ? true
        : garage.partnerBadgeAdminOverride === "FORCE_OFF"
        ? false
        : garage.partnerBadgeEnabled;

    return NextResponse.json(
      success({
        ...garage,
        logoUrl,
        partnerBadgeEffective,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}

// ============================================================
// PUT /api/garages/profile
// Updates the current garage's profile
// ============================================================

const UpdateProfileSchema = z.object({
  displayName: z.string().trim().max(200).optional().nullable(),
  legalName: z.string().trim().max(200).optional().nullable(),
  siret: z
    .string()
    .trim()
    .refine((val) => !val || val.length === 14, {
      message: "Le SIRET doit contenir exactement 14 chiffres",
    })
    .optional()
    .nullable(),
  email: z.string().trim().email("Email invalide").optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  addressLine1: z.string().trim().max(200).optional().nullable(),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional(),
  logoKey: z.string().trim().max(500).optional().nullable(),
  partnerBadgeEnabled: z.boolean().optional(),
  publicProfileEnabled: z.boolean().optional(),
  publicPhone: z.string().trim().max(30).optional().nullable(),
  publicWebsite: z.string().trim().max(200).optional().nullable(),
});

export async function PUT(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    if (!user.garageId) {
      throw new RouteError(400, "TENANT_REQUIRED", "Garage non trouvé");
    }

    const json = await req.json().catch(() => null);
    const parsed = UpdateProfileSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "BAD_REQUEST",
            message: "Données invalides",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName || null;
    if (data.legalName !== undefined) updateData.legalName = data.legalName || null;
    if (data.siret !== undefined) updateData.siret = data.siret || null;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1 || null;
    if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2 || null;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode || null;
    if (data.city !== undefined) updateData.city = data.city || null;
    if (data.country !== undefined) updateData.country = data.country || "France";
    if (data.logoKey !== undefined) updateData.logoKey = data.logoKey || null;
    if (data.partnerBadgeEnabled !== undefined) updateData.partnerBadgeEnabled = data.partnerBadgeEnabled;
    if (data.publicProfileEnabled !== undefined) updateData.publicProfileEnabled = data.publicProfileEnabled;
    if (data.publicPhone !== undefined) updateData.publicPhone = data.publicPhone || null;
    if (data.publicWebsite !== undefined) updateData.publicWebsite = data.publicWebsite || null;

    const updated = await prisma.garage.update({
      where: { id: user.garageId },
      data: updateData,
      select: {
        id: true,
        name: true,
        displayName: true,
        legalName: true,
        siret: true,
        email: true,
        phone: true,
        address: true,
        addressLine1: true,
        addressLine2: true,
        postalCode: true,
        city: true,
        country: true,
        logoKey: true,
        partnerBadgeEnabled: true,
        partnerBadgeAdminOverride: true,
        publicProfileEnabled: true,
        publicPhone: true,
        publicWebsite: true,
      },
    });

    const logoUrl = updated.logoKey ? `/api/uploads/file/${updated.logoKey}` : null;

    // Compute effective partner badge status
    const partnerBadgeEffective =
      updated.partnerBadgeAdminOverride === "FORCE_ON"
        ? true
        : updated.partnerBadgeAdminOverride === "FORCE_OFF"
        ? false
        : updated.partnerBadgeEnabled;

    return NextResponse.json(
      success({
        ...updated,
        logoUrl,
        partnerBadgeEffective,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
