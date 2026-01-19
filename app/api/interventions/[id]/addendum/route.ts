/**
 * EVIDENCE-LOCKDOWN-01: Append-Only Addenda Endpoint
 * POST /api/interventions/[id]/addendum
 *
 * Allows adding append-only notes during dispute mode.
 * These are the ONLY mutations allowed when an intervention is locked.
 * Each addendum is hashed and linked to the previous one (hash chain).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { addEvidenceEntry } from "@/lib/legal/evidenceChain";
import { isInterventionLocked } from "@/lib/legal/evidenceLock";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const AddendumSchema = z.object({
  text: z.string().min(1, "Le texte ne peut pas être vide").max(10000, "Le texte est trop long (max 10000 caractères)"),
});

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Only OWNER, ADMIN, or GARAGE can add addenda
    if (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "GARAGE") {
      throw new RouteError(403, "FORBIDDEN", "Permission refusée");
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const body = await req.json();
    const parsed = AddendumSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(failure(parsed.error.issues[0].message), { status: 400 });
    }

    const { text } = parsed.data;

    // Get intervention
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    const garageId = intervention.garageId ?? user.garageId ?? -1;
    const isLocked = await isInterventionLocked(id);

    // Check if intervention is in dispute
    if (!isLocked) {
      throw new RouteError(400, "NOT_IN_DISPUTE", "Les addenda ne peuvent être ajoutés que pendant un litige actif");
    }

    // Get the last addendum for chain linking
    const lastAddendum = await prisma.evidenceAddendum.findFirst({
      where: { interventionId: id },
      orderBy: { createdAt: "desc" },
      select: { sha256: true },
    });

    // Create the addendum with hash chain
    const textHash = sha256(text);
    const prevHash = lastAddendum?.sha256 ?? null;

    const addendum = await prisma.evidenceAddendum.create({
      data: {
        garageId,
        interventionId: id,
        text,
        sha256: textHash,
        prevHash,
        createdByUserId: user.id,
      },
    });

    // Add to evidence chain
    await addEvidenceEntry({
      garageId,
      entityType: "intervention",
      entityId: id,
      eventType: "addendum_added",
      payload: {
        addendumId: addendum.id,
        textHash,
        prevHash,
        textLength: text.length,
        // Do not store full text in chain for privacy, just hash
      },
      context: {
        userId: user.id,
        reason: "Ajout d'un addendum pendant litige",
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: "EvidenceAddendum",
        entityId: addendum.id,
        action: "ADDENDUM_CREATED",
        userId: user.id,
        metadata: {
          interventionId: id,
          textLength: text.length,
          sha256: textHash,
        },
      },
    });

    return NextResponse.json(success({
      id: addendum.id,
      sha256: textHash,
      prevHash,
      createdAt: addendum.createdAt,
      message: "Addendum ajouté avec succès",
    }));
  } catch (err) {
    console.error("[Addendum] Error:", err);
    return toErrorResponse(err);
  }
}

// GET: List all addenda for an intervention
export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        evidenceAddenda: {
          orderBy: { createdAt: "asc" },
          include: {
            createdBy: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    return NextResponse.json(success({
      interventionId: id,
      disputeStatus: intervention.disputeStatus,
      addenda: intervention.evidenceAddenda.map(a => ({
        id: a.id,
        text: a.text,
        sha256: a.sha256,
        prevHash: a.prevHash,
        createdAt: a.createdAt,
        createdBy: a.createdBy,
      })),
    }));
  } catch (err) {
    console.error("[Addendum List] Error:", err);
    return toErrorResponse(err);
  }
}
