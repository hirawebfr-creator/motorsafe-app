/**
 * EVIDENCE-CAPTURE-01: Evidence Signature API
 * 
 * POST /api/interventions/[id]/evidence-sign
 *   - Generate QR code / signature request for intake or delivery
 *   - Creates ConsentRecord on signature
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantIdWithAdminOverride } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";
import { EvidenceCaptureStep } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SignRequestSchema = z.object({
  step: z.enum(["INTAKE", "DELIVERY"]),
  sessionId: z.string().min(1),
  method: z.enum(["QR_CODE", "IN_APP"]).default("QR_CODE"),
});

const SubmitSignatureSchema = z.object({
  sessionId: z.string().min(1),
  step: z.enum(["INTAKE", "DELIVERY"]),
  signerName: z.string().min(2),
  signatureDataUrl: z.string().min(10), // base64 signature image
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Helper: Get garageId from intervention (for admins) or from user tenant
 */
async function getGarageIdForIntervention(user: { role: string; garageId: number | null }, req: Request, interventionId: string): Promise<number> {
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
  
  const garageId = getTenantIdWithAdminOverride(user as Parameters<typeof getTenantIdWithAdminOverride>[0], req);
  if (!garageId) {
    throw new RouteError(400, "TENANT_REQUIRED", "Garage requis");
  }
  return garageId;
}

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * POST /api/interventions/[id]/evidence-sign
 * Start or complete signature flow for evidence session
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await context.params;
    const garageId = await getGarageIdForIntervention(user, req, interventionId);

    const json = await req.json().catch(() => null);

    // Check if this is a signature submission or a request start
    const isSubmission = json?.signatureDataUrl;

    if (isSubmission) {
      // Handle signature submission
      const parsed = SubmitSignatureSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
          { status: 400 }
        );
      }

      const { sessionId, step, signerName, signatureDataUrl } = parsed.data;

      // Verify intervention
      const intervention = await prisma.intervention.findFirst({
        where: user.role === "ADMIN"
          ? { id: interventionId, deletedAt: null }
          : { id: interventionId, garageId, deletedAt: null },
        include: { 
          vehicle: { include: { client: true } },
          garage: true,
        },
      });
      if (!intervention) {
        return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
      }

      // Verify session
      const session = await prisma.evidenceCaptureSession.findFirst({
        where: { id: sessionId, interventionId, garageId, step: step as EvidenceCaptureStep },
        include: { items: true },
      });
      if (!session) {
        return NextResponse.json(failure("Session non trouvée"), { status: 404 });
      }

      // Check requirements for INTAKE - photos are now optional but recommended
      if (step === "INTAKE") {
        const forms = session.items.filter(i => i.type === "FORM");
        
        // Only forms are required, photos are optional but highly recommended
        if (forms.length === 0) {
          return NextResponse.json(failure("Formulaire de réception requis"), { status: 400 });
        }
      }

      // Save signature as evidence item
      const signatureBuffer = Buffer.from(signatureDataUrl.split(",")[1] || signatureDataUrl, "base64");
      const signatureHash = sha256(signatureBuffer.toString("base64"));

      // Save signature file
      const fs = await import("fs/promises");
      const path = await import("path");
      
      const key = `uploads/${garageId}/evidence/${interventionId}/${step.toLowerCase()}/signature_${signatureHash.slice(0, 12)}.png`;
      const absPath = path.join(process.cwd(), "uploads", key);
      
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, signatureBuffer);

      // Get previous item hash
      const lastItem = await prisma.evidenceItem.findFirst({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        select: { sha256: true },
      });

      // Create signature evidence item
      const signatureItem = await prisma.evidenceItem.create({
        data: {
          garageId,
          interventionId,
          sessionId,
          type: "SIGNATURE",
          label: step === "INTAKE" ? "Signature état d'entrée" : "Signature PV de restitution",
          category: step === "INTAKE" ? "INTAKE_SIGNATURE" : "DELIVERY_SIGNATURE",
          storageKey: key,
          fileName: `signature_${step.toLowerCase()}.png`,
          mime: "image/png",
          sizeBytes: signatureBuffer.length,
          jsonData: { signerName, signedAt: new Date().toISOString() },
          sha256: signatureHash,
          prevItemHash: lastItem?.sha256 ?? null,
          createdByUserId: user.id,
        },
      });

      // Create consent record
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
      const userAgent = req.headers.get("user-agent") || "";

      await prisma.consentRecord.create({
        data: {
          signatureMethod: "IN_APP",
          acceptedAt: new Date(),
          ipHash: sha256(ip),
          userAgentHash: sha256(userAgent),
          consentHash: sha256(JSON.stringify({
            interventionId,
            sessionId,
            step,
            signerName,
            signatureHash,
            timestamp: new Date().toISOString(),
          })),
          legalDocsAccepted: [
            { type: step === "INTAKE" ? "INTAKE_ACKNOWLEDGMENT" : "DELIVERY_ACKNOWLEDGMENT" },
          ],
        },
      });

      // Update session status
      const updateData: Record<string, unknown> = { status: "SIGNED" };
      if (step === "INTAKE") {
        updateData.intakeCompletedAt = new Date();
      } else {
        updateData.deliveryCompletedAt = new Date();
      }

      const updatedSession = await prisma.evidenceCaptureSession.update({
        where: { id: sessionId },
        data: updateData,
        include: { items: { orderBy: { createdAt: "asc" } } },
      });

      // Add to evidence chain
      await addEvidenceEntry({
        garageId,
        entityType: "intervention",
        entityId: interventionId,
        eventType: "snapshot",
        payload: {
          action: step === "INTAKE" ? "intake_signed" : "delivery_signed",
          sessionId,
          signerName,
          signatureItemId: signatureItem.id,
          signatureHash,
          itemsCount: session.items.length + 1,
        },
        context: {
          userId: user.id,
          ip: ip || undefined,
          userAgent: userAgent || undefined,
        },
      });

      return NextResponse.json(success({
        signed: true,
        session: updatedSession,
        signatureItem,
      }));

    } else {
      // Generate QR code / start signature flow
      const parsed = SignRequestSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
          { status: 400 }
        );
      }

      const { step, sessionId, method } = parsed.data;

      // Verify intervention
      const intervention = await prisma.intervention.findFirst({
        where: { id: interventionId, garageId, deletedAt: null },
        include: { garage: true },
      });
      if (!intervention) {
        return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
      }

      // Verify session exists
      const session = await prisma.evidenceCaptureSession.findFirst({
        where: { id: sessionId, interventionId, garageId, step: step as EvidenceCaptureStep },
        include: { items: true },
      });
      if (!session) {
        return NextResponse.json(failure("Session non trouvée"), { status: 404 });
      }

      // Generate a short-lived token for QR code signing
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store in signature request table for tracking
      const signatureRequest = await prisma.signatureRequest.create({
        data: {
          token,
          expiresAt,
          documentType: step === "INTAKE" ? "INTERVENTION_ORDER" : "INTERVENTION_DELIVERY",
          documentId: interventionId,
          garageId,
          status: "SENT",
          pdfRoute: `/api/interventions/${interventionId}/evidence-session?step=${step}`,
        },
      });

      // Build QR code URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://safemotor.fr";
      const signUrl = `${baseUrl}/sign/${token}?evidence=true&step=${step}&sessionId=${sessionId}`;

      return NextResponse.json(success({
        method,
        token,
        signUrl,
        expiresAt: expiresAt.toISOString(),
        signatureRequestId: signatureRequest.id,
        session,
      }));
    }
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * GET /api/interventions/[id]/evidence-sign?step=INTAKE
 * Get signature status for a step
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: interventionId } = await context.params;
    const garageId = await getGarageIdForIntervention(user, req, interventionId);

    const url = new URL(req.url);
    const step = url.searchParams.get("step");

    if (!step || !["INTAKE", "DELIVERY"].includes(step)) {
      return NextResponse.json(failure("Paramètre step requis (INTAKE ou DELIVERY)"), { status: 400 });
    }

    // Verify intervention
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id: interventionId, deletedAt: null }
        : { id: interventionId, garageId, deletedAt: null },
      select: { id: true },
    });
    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Get session
    const session = await prisma.evidenceCaptureSession.findFirst({
      where: { interventionId, garageId, step: step as EvidenceCaptureStep },
      include: {
        items: {
          where: { type: "SIGNATURE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!session) {
      return NextResponse.json(success({ exists: false, signed: false }));
    }

    const signatureItem = session.items[0];
    const signed = session.status === "SIGNED" && !!signatureItem;

    return NextResponse.json(success({
      exists: true,
      signed,
      status: session.status,
      signatureItem: signatureItem || null,
      completedAt: step === "INTAKE" ? session.intakeCompletedAt : session.deliveryCompletedAt,
    }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
