/**
 * Yousign Webhook Handler
 * Receives events from Yousign and processes them
 * 
 * Events handled:
 * - signature_request.done: Signature completed
 * - signature_request.declined: Signer declined
 * - signature_request.expired: Request expired
 * - signer.done: Individual signer completed
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  downloadSignedDocuments,
  downloadAuditTrails,
} from "@/lib/yousign";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YOUSIGN_WEBHOOK_SECRET = process.env.YOUSIGN_WEBHOOK_SECRET || "";

interface YousignWebhookPayload {
  event_id: string;
  event_name: string;
  event_time: string;
  sandbox: boolean;
  data: {
    signature_request?: {
      id: string;
      status: string;
      name: string;
      external_id?: string;
    };
    signer?: {
      id: string;
      status: string;
      info?: {
        first_name: string;
        last_name: string;
        email: string;
      };
    };
  };
}

export async function POST(req: Request) {
  console.log("[Yousign Webhook] Received webhook request");

  try {
    // 1. Read raw body for signature verification
    const rawBody = await req.text();

    // 2. Get signature header
    const signature = req.headers.get("x-yousign-signature-256") || "";

    // 3. Verify signature
    if (!YOUSIGN_WEBHOOK_SECRET) {
      console.error("[Yousign Webhook] YOUSIGN_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature, YOUSIGN_WEBHOOK_SECRET);
    if (!isValid) {
      console.error("[Yousign Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("[Yousign Webhook] Signature verified");

    // 4. Parse payload
    const payload: YousignWebhookPayload = JSON.parse(rawBody);
    const { event_id, event_name, data } = payload;

    console.log(`[Yousign Webhook] Event: ${event_name}, ID: ${event_id}`);

    // 5. Check idempotency - don't process same event twice
    const existingEvent = await prisma.yousignWebhookEvent.findUnique({
      where: { eventId: event_id },
    });

    if (existingEvent) {
      console.log(`[Yousign Webhook] Event ${event_id} already processed, skipping`);
      return NextResponse.json({ ok: true, message: "Already processed" });
    }

    // 6. Find the ESignatureRequest
    const providerSignatureRequestId = data.signature_request?.id;
    if (!providerSignatureRequestId) {
      console.error("[Yousign Webhook] No signature_request.id in payload");
      // Still store the event for debugging
      await prisma.yousignWebhookEvent.create({
        data: {
          eventId: event_id,
          eventName: event_name,
          payloadJson: JSON.parse(JSON.stringify(payload)),
          processedOk: false,
          processingError: "No signature_request.id in payload",
        },
      });
      return NextResponse.json({ ok: true, message: "No signature request ID" });
    }

    const eSignRequest = await prisma.eSignatureRequest.findUnique({
      where: { providerSignatureRequestId },
    });

    // 7. Store webhook event
    const webhookEvent = await prisma.yousignWebhookEvent.create({
      data: {
        eventId: event_id,
        eventName: event_name,
        payloadJson: JSON.parse(JSON.stringify(payload)),
        eSignatureRequestId: eSignRequest?.id || null,
      },
    });

    // 8. Process based on event type
    try {
      if (!eSignRequest) {
        console.warn(`[Yousign Webhook] No ESignatureRequest found for ${providerSignatureRequestId}`);
        await prisma.yousignWebhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processedAt: new Date(),
            processedOk: false,
            processingError: "ESignatureRequest not found",
          },
        });
        return NextResponse.json({ ok: true, message: "Request not found" });
      }

      switch (event_name) {
        case "signature_request.done":
          await handleSignatureRequestDone(eSignRequest, payload);
          break;

        case "signature_request.declined":
          await prisma.eSignatureRequest.update({
            where: { id: eSignRequest.id },
            data: {
              status: "DECLINED",
              declinedAt: new Date(),
              providerMetaJson: JSON.parse(JSON.stringify(payload)),
            },
          });
          break;

        case "signature_request.expired":
          await prisma.eSignatureRequest.update({
            where: { id: eSignRequest.id },
            data: {
              status: "EXPIRED",
              expiredAt: new Date(),
              providerMetaJson: JSON.parse(JSON.stringify(payload)),
            },
          });
          break;

        case "signature_request.canceled":
          await prisma.eSignatureRequest.update({
            where: { id: eSignRequest.id },
            data: {
              status: "CANCELED",
              canceledAt: new Date(),
              providerMetaJson: JSON.parse(JSON.stringify(payload)),
            },
          });
          break;

        case "signer.done":
          // Update status to reflect signer has signed
          // For single-signer requests, this usually means the whole request is done
          console.log(`[Yousign Webhook] Signer done for ${eSignRequest.id}`);
          break;

        case "signer.declined":
          // A signer declined
          console.log(`[Yousign Webhook] Signer declined for ${eSignRequest.id}`);
          break;

        default:
          console.log(`[Yousign Webhook] Unhandled event: ${event_name}`);
      }

      // Mark event as processed
      await prisma.yousignWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processedAt: new Date(),
          processedOk: true,
        },
      });

    } catch (processingError) {
      console.error(`[Yousign Webhook] Error processing event:`, processingError);
      await prisma.yousignWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processedAt: new Date(),
          processedOk: false,
          processingError: processingError instanceof Error ? processingError.message : "Unknown error",
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Yousign Webhook] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// Handle signature_request.done
// ============================================

async function handleSignatureRequestDone(
  eSignRequest: {
    id: string;
    garageId: number;
    interventionId: string | null;
    quoteId: string | null;
    providerSignatureRequestId: string | null;
    documentType: string;
    signerName: string;
  },
  payload: YousignWebhookPayload
) {
  console.log(`[Yousign Webhook] Processing signature_request.done for ${eSignRequest.id}`);

  if (!eSignRequest.providerSignatureRequestId) {
    throw new Error("No provider signature request ID");
  }

  // 1. Download signed documents
  console.log("[Yousign Webhook] Downloading signed documents...");
  const signedDocsBuffer = await downloadSignedDocuments(
    eSignRequest.providerSignatureRequestId
  );

  // 2. Download audit trails
  console.log("[Yousign Webhook] Downloading audit trails...");
  const auditTrailBuffer = await downloadAuditTrails(
    eSignRequest.providerSignatureRequestId
  );

  // 3. Store files locally
  const timestamp = Date.now();
  const baseDir = `uploads/${eSignRequest.garageId}/yousign`;
  const signedDocKey = `${baseDir}/signed_${eSignRequest.id}_${timestamp}.zip`;
  const auditTrailKey = `${baseDir}/audit_${eSignRequest.id}_${timestamp}.zip`;

  // Create directory
  const absDir = path.join(process.cwd(), "uploads", baseDir);
  await mkdir(absDir, { recursive: true });

  // Write signed documents
  const signedDocPath = path.join(process.cwd(), "uploads", signedDocKey);
  await writeFile(signedDocPath, Buffer.from(signedDocsBuffer));
  console.log(`[Yousign Webhook] Saved signed documents to ${signedDocKey}`);

  // Write audit trail
  const auditTrailPath = path.join(process.cwd(), "uploads", auditTrailKey);
  await writeFile(auditTrailPath, Buffer.from(auditTrailBuffer));
  console.log(`[Yousign Webhook] Saved audit trail to ${auditTrailKey}`);

  // 4. Update ESignatureRequest
  const signedDocUrl = `/api/uploads/file/${signedDocKey}`;
  const auditTrailUrl = `/api/uploads/file/${auditTrailKey}`;

  await prisma.eSignatureRequest.update({
    where: { id: eSignRequest.id },
    data: {
      status: "DONE",
      signedAt: new Date(),
      signedDocumentUrl: signedDocUrl,
      signedDocumentKey: signedDocKey,
      auditTrailUrl: auditTrailUrl,
      auditTrailKey: auditTrailKey,
      providerMetaJson: JSON.parse(JSON.stringify(payload)),
    },
  });

  // 5. Create Document records for the signed files
  // Signed document
  await prisma.document.create({
    data: {
      garageId: eSignRequest.garageId,
      interventionId: eSignRequest.interventionId,
      type: "SIGNED_DOCUMENT",
      category: "SORTIE",
      fileUrl: signedDocUrl,
      fileName: `Document_signe_${eSignRequest.signerName.replace(/\s+/g, "_")}.zip`,
      mime: "application/zip",
      size: signedDocsBuffer.byteLength,
    },
  });

  // Audit trail
  await prisma.document.create({
    data: {
      garageId: eSignRequest.garageId,
      interventionId: eSignRequest.interventionId,
      type: "AUDIT_TRAIL",
      category: "SORTIE",
      fileUrl: auditTrailUrl,
      fileName: `Certificat_signature_${eSignRequest.signerName.replace(/\s+/g, "_")}.zip`,
      mime: "application/zip",
      size: auditTrailBuffer.byteLength,
    },
  });

  console.log(`[Yousign Webhook] Successfully processed signature_request.done for ${eSignRequest.id}`);
}
