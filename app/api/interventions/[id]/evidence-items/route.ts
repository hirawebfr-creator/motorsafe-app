/**
 * EVIDENCE-CAPTURE-01: Evidence Items API
 * 
 * POST /api/interventions/[id]/evidence-items
 *   - Add photo, form, OBD report, signature, or note to session
 * 
 * GET /api/interventions/[id]/evidence-items?sessionId=xxx
 *   - List items for session or all items for intervention
 * 
 * DELETE /api/interventions/[id]/evidence-items/[itemId]
 *   - Delete item (only if no dispute + admin can force)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { success, failure } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";
import { createHash } from "crypto";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";
import { EvidenceItemType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateItemSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(["PHOTO", "VIDEO", "FORM", "OBD_REPORT", "SIGNATURE", "NOTE"]),
  label: z.string().optional(),
  category: z.string().optional(),
  storageKey: z.string().optional(),
  fileName: z.string().optional(),
  mime: z.string().optional(),
  sizeBytes: z.number().optional(),
  jsonData: z.record(z.string(), z.unknown()).optional(),
  contentBase64: z.string().optional(), // For inline file upload
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Compute SHA256 hash
 */
function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * GET /api/interventions/[id]/evidence-items?sessionId=xxx
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    const { id: interventionId } = await context.params;

    // Verify intervention access
    const intervention = await prisma.intervention.findFirst({
      where: { id: interventionId, garageId, deletedAt: null },
      select: { id: true },
    });
    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    const typeFilter = url.searchParams.get("type");

    const where: Record<string, unknown> = { interventionId, garageId };
    if (sessionId) where.sessionId = sessionId;
    if (typeFilter) where.type = typeFilter;

    const items = await prisma.evidenceItem.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: { select: { id: true, email: true } },
        session: { select: { step: true, status: true } },
      },
    });

    return NextResponse.json(success({ items }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/interventions/[id]/evidence-items
 * Add a new evidence item
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    const { id: interventionId } = await context.params;

    // Parse body
    const json = await req.json().catch(() => null);
    const parsed = CreateItemSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify intervention access
    const intervention = await prisma.intervention.findFirst({
      where: { id: interventionId, garageId, deletedAt: null },
      select: { id: true, disputeStatus: true },
    });
    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Verify session exists and belongs to this intervention
    const session = await prisma.evidenceCaptureSession.findFirst({
      where: { id: data.sessionId, interventionId, garageId },
    });
    if (!session) {
      return NextResponse.json(failure("Session non trouvée"), { status: 404 });
    }

    // If session is already SIGNED, no more items can be added (unless admin)
    if (session.status === "SIGNED" && user.role !== "ADMIN") {
      return NextResponse.json(failure("Session déjà signée, ajout impossible"), { status: 400 });
    }

    // Get previous item hash for chaining
    const lastItem = await prisma.evidenceItem.findFirst({
      where: { sessionId: data.sessionId },
      orderBy: { createdAt: "desc" },
      select: { sha256: true },
    });

    // Compute hash based on content type
    let contentHash: string;
    let storageKey = data.storageKey;

    if (data.contentBase64) {
      // Inline file upload - save to local storage
      const buf = Buffer.from(data.contentBase64, "base64");
      contentHash = sha256(buf);
      
      // Save file to local storage
      const fs = await import("fs/promises");
      const path = await import("path");
      
      const ext = data.fileName?.split(".").pop() || "bin";
      const key = `uploads/${garageId}/evidence/${interventionId}/${session.step.toLowerCase()}/${contentHash.slice(0, 12)}.${ext}`;
      const absPath = path.join(process.cwd(), "uploads", key);
      
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, buf);
      
      storageKey = key;
    } else if (data.jsonData) {
      // JSON data - hash the stringified content
      const jsonStr = JSON.stringify(data.jsonData, Object.keys(data.jsonData).sort());
      contentHash = sha256(jsonStr);
    } else if (data.storageKey) {
      // External storage key - compute hash from the key itself (file already uploaded)
      contentHash = sha256(data.storageKey);
    } else {
      return NextResponse.json(failure("contentBase64, jsonData, ou storageKey requis"), { status: 400 });
    }

    // Create the evidence item
    const item = await prisma.evidenceItem.create({
      data: {
        garageId,
        interventionId,
        sessionId: data.sessionId,
        type: data.type as EvidenceItemType,
        label: data.label,
        category: data.category,
        storageKey,
        fileName: data.fileName,
        mime: data.mime,
        sizeBytes: data.sizeBytes,
        jsonData: data.jsonData as Prisma.InputJsonValue | undefined,
        sha256: contentHash,
        prevItemHash: lastItem?.sha256 ?? null,
        createdByUserId: user.id,
      },
      include: {
        session: { select: { step: true, status: true } },
      },
    });

    // Add to evidence chain for tamper-evidence
    await addEvidenceEntry({
      garageId,
      entityType: "intervention",
      entityId: interventionId,
      eventType: "snapshot",
      payload: {
        action: "evidence_item_added",
        itemId: item.id,
        type: item.type,
        label: item.label,
        category: item.category,
        sha256: item.sha256,
        sessionStep: session.step,
      },
      context: {
        userId: user.id,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json(success({ item }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * DELETE /api/interventions/[id]/evidence-items
 * Delete an evidence item (restricted)
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantId(user);
    const { id: interventionId } = await context.params;

    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json(failure("itemId requis"), { status: 400 });
    }

    // Verify intervention access
    const intervention = await prisma.intervention.findFirst({
      where: { id: interventionId, garageId, deletedAt: null },
      select: { id: true, disputeStatus: true },
    });
    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // If dispute is open, no deletion allowed (even admin must use addendum)
    if (intervention.disputeStatus === "OPEN") {
      return NextResponse.json(
        failure("Intervention en litige - suppression impossible. Utilisez un addendum."),
        { status: 403 }
      );
    }

    // Find item
    const item = await prisma.evidenceItem.findFirst({
      where: { id: itemId, interventionId, garageId },
      include: { session: true },
    });
    if (!item) {
      return NextResponse.json(failure("Item non trouvé"), { status: 404 });
    }

    // If session is SIGNED, only admin can delete
    if (item.session.status === "SIGNED" && user.role !== "ADMIN") {
      return NextResponse.json(failure("Session signée - suppression réservée aux admins"), { status: 403 });
    }

    // Log deletion in evidence chain before deleting
    await addEvidenceEntry({
      garageId,
      entityType: "intervention",
      entityId: interventionId,
      eventType: "snapshot",
      payload: {
        action: "evidence_item_deleted",
        itemId: item.id,
        type: item.type,
        label: item.label,
        sha256: item.sha256,
        deletedBy: user.id,
        deletedByRole: user.role,
      },
      context: {
        userId: user.id,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
        reason: "Evidence item deleted by user",
      },
    });

    // Delete item
    await prisma.evidenceItem.delete({ where: { id: itemId } });

    return NextResponse.json(success({ deleted: true, itemId }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
