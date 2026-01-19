/**
 * LEGAL-PACK-01: Company Profile Management (Admin only)
 * GET /api/admin/legal/company - Get company profile
 * PUT /api/admin/legal/company - Update company profile
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireUser, requireRole } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CompanyProfileSchema = z.object({
  companyName: z.string().min(1).max(200),
  legalForm: z.string().min(1).max(50),
  address: z.string().min(1).max(500),
  postalCode: z.string().min(1).max(20),
  city: z.string().min(1).max(100),
  country: z.string().default("France"),
  siret: z.string().max(20).optional().nullable(),
  rcs: z.string().max(100).optional().nullable(),
  vatNumber: z.string().max(50).optional().nullable(),
  shareCapital: z.string().max(50).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  publicationDirector: z.string().min(1).max(200),
  hostingProvider: z.string().min(1).max(200),
  hostingAddress: z.string().min(1).max(500),
  hostingUrl: z.string().url().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const profile = await prisma.companyProfile.findFirst();

    return NextResponse.json(success(profile));
  } catch (err) {
    console.error("[Company Profile GET] Error:", err);
    return toErrorResponse(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser(req);
    requireRole(user, ["ADMIN"]);

    const body = await req.json();
    const parsed = CompanyProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failure(parsed.error.issues[0].message), { status: 400 });
    }

    const data = parsed.data;

    // Upsert - create if not exists, update if exists
    const existing = await prisma.companyProfile.findFirst();

    let profile;
    if (existing) {
      profile = await prisma.companyProfile.update({
        where: { id: existing.id },
        data,
      });
    } else {
      profile = await prisma.companyProfile.create({
        data,
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "CompanyProfile",
        entityId: profile.id,
        action: existing ? "UPDATED" : "CREATED",
        userId: user.id,
        metadata: { companyName: data.companyName },
      },
    });

    return NextResponse.json(success(profile));
  } catch (err) {
    console.error("[Company Profile PUT] Error:", err);
    return toErrorResponse(err);
  }
}
