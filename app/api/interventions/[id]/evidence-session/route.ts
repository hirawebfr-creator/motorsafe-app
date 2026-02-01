/**
 * EVIDENCE-CAPTURE-01: Evidence Capture Session API
 * 
 * GET /api/interventions/[id]/evidence-session?step=INTAKE|TECH|DELIVERY
 *   - Returns existing session or null
 * 
 * POST /api/interventions/[id]/evidence-session
 *   - Creates or returns existing session for step
 * 
 * PATCH /api/interventions/[id]/evidence-session
 *   - Updates session status (complete step)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantIdWithAdminOverride } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { z } from "zod";
import { EvidenceCaptureStep } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSessionSchema = z.object({
  step: z.enum(["INTAKE", "TECH", "DELIVERY"]),
});

const UpdateSessionSchema = z.object({
  status: z.enum(["DRAFT", "READY", "SIGNED"]).optional(),
  completeStep: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Helper: Get garageId from intervention (for admins) or from user tenant
 */
async function getGarageIdForIntervention(user: { role: string; garageId: number | null }, req: Request, interventionId: string): Promise<number> {
  // Si admin, on récupère le garageId de l'intervention directement
  if (user.role === "ADMIN") {
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { garageId: true },
    });
    if (!intervention || intervention.garageId === null) {
      throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    }
    return intervention.garageId;
  }
  
  // Si garage, on utilise le tenant
  const garageId = getTenantIdWithAdminOverride(user as Parameters<typeof getTenantIdWithAdminOverride>[0], req);
  if (!garageId) {
    throw new RouteError(400, "TENANT_REQUIRED", "Garage requis");
  }
  return garageId;
}

/**
 * GET /api/interventions/[id]/evidence-session?step=INTAKE
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await context.params;
    const garageId = await getGarageIdForIntervention(user, req, interventionId);

    // Verify intervention access
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN" 
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId, deletedAt: null },
      select: { id: true },
    });
    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Get step from query
    const url = new URL(req.url);
    const stepParam = url.searchParams.get("step");
    
    if (stepParam) {
      // Get specific session
      const session = await prisma.evidenceCaptureSession.findFirst({
        where: { interventionId, garageId, step: stepParam as EvidenceCaptureStep },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              type: true,
              label: true,
              category: true,
              storageKey: true,
              fileName: true,
              mime: true,
              sizeBytes: true,
              jsonData: true,
              sha256: true,
              createdAt: true,
            },
          },
          createdBy: { select: { id: true, email: true } },
        },
      });

      return NextResponse.json(success({ session }));
    }

    // Get all sessions for this intervention
    const sessions = await prisma.evidenceCaptureSession.findMany({
      where: { interventionId, garageId },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            type: true,
            label: true,
            category: true,
            sha256: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(success({ sessions }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/interventions/[id]/evidence-session
 * Create a new session or return existing one
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await context.params;

    // Parse body
    const json = await req.json().catch(() => null);
    const parsed = CreateSessionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { step } = parsed.data;
    const garageId = await getGarageIdForIntervention(user, req, interventionId);

    // Verify intervention access
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId, deletedAt: null },
      select: { id: true, status: true, disputeStatus: true },
    });
    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Use upsert to avoid race condition (P2002 unique constraint error)
    // The unique constraint is on (interventionId, step)
    try {
      // First try to find existing session
      const existing = await prisma.evidenceCaptureSession.findFirst({
        where: { interventionId, step },
        include: { items: { orderBy: { createdAt: "asc" } } },
      });

      if (existing) {
        return NextResponse.json(success({ session: existing, created: false }));
      }

      // Create new session - if it fails with P2002, we fetch and return the existing one
      const session = await prisma.evidenceCaptureSession.create({
        data: {
          garageId,
          interventionId,
          step,
          status: "DRAFT",
          createdByUserId: user.id,
        },
        include: { items: true },
      });

      return NextResponse.json(success({ session, created: true }), { status: 201 });
    } catch (createErr) {
      // Handle unique constraint violation (race condition)
      if (
        createErr &&
        typeof createErr === "object" &&
        "code" in createErr &&
        createErr.code === "P2002"
      ) {
        // Another request created the session first, fetch and return it
        const existing = await prisma.evidenceCaptureSession.findFirst({
          where: { interventionId, step },
          include: { items: { orderBy: { createdAt: "asc" } } },
        });
        if (existing) {
          return NextResponse.json(success({ session: existing, created: false }));
        }
      }
      // Re-throw other errors
      throw createErr;
    }
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * PATCH /api/interventions/[id]/evidence-session?step=INTAKE
 * Update session status or complete step
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await context.params;

    // Get step from query
    const url = new URL(req.url);
    const stepParam = url.searchParams.get("step");
    if (!stepParam || !["INTAKE", "TECH", "DELIVERY"].includes(stepParam)) {
      return NextResponse.json(failure("Paramètre step requis (INTAKE, TECH, DELIVERY)"), { status: 400 });
    }

    // Parse body
    const json = await req.json().catch(() => null);
    const parsed = UpdateSessionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const garageId = await getGarageIdForIntervention(user, req, interventionId);

    // Find session
    const session = await prisma.evidenceCaptureSession.findFirst({
      where: { interventionId, garageId, step: stepParam as EvidenceCaptureStep },
      include: { items: true },
    });
    if (!session) {
      return NextResponse.json(failure("Session non trouvée"), { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (parsed.data.status) {
      updateData.status = parsed.data.status;
    }

    if (parsed.data.completeStep) {
      const now = new Date();
      if (stepParam === "INTAKE") {
        updateData.intakeCompletedAt = now;
      } else if (stepParam === "TECH") {
        updateData.techCompletedAt = now;
      } else if (stepParam === "DELIVERY") {
        updateData.deliveryCompletedAt = now;
      }
      updateData.status = "READY";
    }

    const updated = await prisma.evidenceCaptureSession.update({
      where: { id: session.id },
      data: updateData,
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(success({ session: updated }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
