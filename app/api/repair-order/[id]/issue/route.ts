/**
 * WORKSHOP-OPS-01: Issue Repair Order
 * 
 * POST - Issue repair order (freeze, generate PDF, send for signature)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { buildRepairOrderPdf } from "@/lib/pdf/repairOrder";
import { randomBytes } from "crypto";
import { decryptClientData } from "@/lib/encryption";
import { sendSignatureEmail } from "@/lib/email";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * POST /api/repair-order/[id]/issue
 * Issue the repair order: freeze snapshot, generate PDF, create signature request
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;

    if (!id) {
      throw new RouteError(400, "BAD_REQUEST", "ID ordre de réparation requis");
    }

    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    // Feature gate
    await requireFeature(user.garageId, FeatureKey.REPAIR_ORDER);

    // Get repair order with intervention data
    const repairOrder = await prisma.repairOrder.findFirst({
      where: { id, garageId: user.garageId },
      include: {
        intervention: {
          include: {
            vehicle: { include: { client: true } },
            garage: true,
          },
        },
      },
    });

    if (!repairOrder) {
      throw new RouteError(404, "NOT_FOUND", "Ordre de réparation introuvable");
    }

    if (repairOrder.status !== "DRAFT") {
      throw new RouteError(400, "BAD_REQUEST", `L'ordre de réparation a déjà été émis (statut: ${repairOrder.status})`);
    }

    const intervention = repairOrder.intervention;

    // Decrypt client data
    const clientRaw = intervention.vehicle.client as Record<string, unknown>;
    const clientDecrypted = decryptClientData(clientRaw) as {
      id: number;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    };

    if (!clientDecrypted.email) {
      throw new RouteError(400, "CLIENT_EMAIL_REQUIRED", "L'email du client est requis pour envoyer l'OR à signer");
    }

    // Generate PDF
    const pdfResult = await buildRepairOrderPdf(repairOrder.id);

    // Store PDF locally (or S3 in production)
    const pdfKey = `repair-orders/${user.garageId}/${repairOrder.id}.pdf`;
    const pdfPath = path.join(process.cwd(), "uploads", pdfKey);
    await mkdir(path.dirname(pdfPath), { recursive: true });
    await writeFile(pdfPath, pdfResult.pdfBuffer);

    // Create signature request
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        token,
        expiresAt,
        documentType: "REPAIR_ORDER",
        documentId: repairOrder.id,
        garageId: user.garageId,
        clientId: clientDecrypted.id,
        status: "SENT",
        pdfHash: pdfResult.sha256,
        pdfRoute: `/api/repair-order/${repairOrder.id}/pdf`,
        signerEmail: clientDecrypted.email,
        sentAt: new Date(),
        createdByUserId: user.id,
      },
    });

    // Create signature event
    await prisma.signatureEvent.create({
      data: {
        signatureRequestId: signatureRequest.id,
        type: "SENT",
        ip: req.headers.get("x-forwarded-for") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    // Update repair order
    await prisma.repairOrder.update({
      where: { id: repairOrder.id },
      data: {
        status: "SENT",
        pdfKey,
        pdfHashSha256: pdfResult.sha256,
        signatureRequestId: signatureRequest.id,
        issuedAt: new Date(),
      },
    });

    // Add to evidence chain
    await addEvidenceEntry({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: intervention.id,
      eventType: "snapshot",
      payload: {
        action: "REPAIR_ORDER_ISSUED",
        repairOrderId: repairOrder.id,
        pdfHash: pdfResult.sha256,
        signatureRequestId: signatureRequest.id,
      },
      context: {
        userId: user.id,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    // Send signature email
    const garageName = intervention.garage?.displayName || intervention.garage?.name || "MotorSafe";
    const clientName = `${clientDecrypted.firstName} ${clientDecrypted.lastName}`.trim();

    await sendSignatureEmail({
      to: clientDecrypted.email,
      clientName,
      garageName,
      documentType: "Ordre de Réparation",
      signingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign/${token}`,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: user.garageId,
        userId: user.id,
        action: "REPAIR_ORDER_ISSUED",
        entityType: "REPAIR_ORDER",
        entityId: repairOrder.id,
        metadata: {
          interventionId: intervention.id,
          signatureRequestId: signatureRequest.id,
          clientEmail: clientDecrypted.email.substring(0, 3) + "***",
        },
      },
    });

    return NextResponse.json(success({
      repairOrderId: repairOrder.id,
      signatureRequestId: signatureRequest.id,
      signUrl: `/sign/${token}`,
      pdfHash: pdfResult.sha256,
    }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
