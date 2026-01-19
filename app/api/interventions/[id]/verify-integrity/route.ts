/**
 * EVIDENCE-LOCKDOWN-01: Integrity Verification Endpoint
 * POST /api/interventions/[id]/verify-integrity
 *
 * Verifies the integrity of all evidence for an intervention:
 * - Recalculates sha256 of all stored DocumentVersions
 * - Verifies evidence chain integrity
 * - Checks signature PDF hashes
 * - Returns detailed report
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { verifyEvidenceChain } from "@/lib/legal/evidenceChain";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function fetchFileBuffer(fileUrl: string): Promise<Buffer | null> {
  try {
    if (fileUrl.startsWith("/api/uploads/file/")) {
      const key = fileUrl.replace("/api/uploads/file/", "");
      const abs = path.join(process.cwd(), "uploads", key);
      return await readFile(abs);
    }
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      const res = await fetch(fileUrl);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    // Direct key
    const abs = path.join(process.cwd(), fileUrl);
    return await readFile(abs);
  } catch {
    return null;
  }
}

interface IntegrityIssue {
  type: "HASH_MISMATCH" | "MISSING_FILE" | "CHAIN_BROKEN" | "ERROR";
  entity: string;
  entityId: string;
  expected?: string;
  actual?: string;
  message: string;
}

interface IntegrityReport {
  interventionId: string;
  garageId: number;
  disputeStatus: string | null;
  verifiedAt: string;
  summary: {
    documentVersionsChecked: number;
    documentVersionsOk: number;
    signaturesChecked: number;
    signaturesOk: number;
    chainValid: boolean;
    chainEntries: number;
    addendaChecked: number;
    addendaOk: number;
  };
  issues: IntegrityIssue[];
  integrityOk: boolean;
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Only OWNER or ADMIN can verify integrity
    if (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "GARAGE") {
      throw new RouteError(403, "FORBIDDEN", "Permission refusée");
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    // Get intervention with related data
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        documentVersions: { orderBy: { generatedAt: "asc" } },
        evidenceAddenda: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    const garageId = intervention.garageId ?? user.garageId ?? -1;
    const issues: IntegrityIssue[] = [];

    // ============================================================
    // 1. Verify Document Versions
    // ============================================================
    let documentVersionsOk = 0;
    for (const version of intervention.documentVersions) {
      try {
        const buffer = await fetchFileBuffer(version.storageKey);
        if (!buffer) {
          issues.push({
            type: "MISSING_FILE",
            entity: "DocumentVersion",
            entityId: version.id,
            message: `Fichier introuvable: ${version.storageKey}`,
          });
          continue;
        }

        const computedHash = sha256(buffer);
        if (computedHash !== version.sha256) {
          issues.push({
            type: "HASH_MISMATCH",
            entity: "DocumentVersion",
            entityId: version.id,
            expected: version.sha256,
            actual: computedHash,
            message: `Hash incorrect pour ${version.documentType} v${version.versionNumber}`,
          });
        } else {
          documentVersionsOk++;
        }
      } catch (err) {
        issues.push({
          type: "ERROR",
          entity: "DocumentVersion",
          entityId: version.id,
          message: `Erreur: ${err}`,
        });
      }
    }

    // ============================================================
    // 2. Verify Signature PDFs
    // ============================================================
    const signatures = await prisma.signatureRequest.findMany({
      where: { documentId: id, garageId },
    });

    let signaturesOk = 0;
    for (const sig of signatures) {
      if (sig.signedPdfKey && sig.signedPdfHash) {
        try {
          const buffer = await fetchFileBuffer(sig.signedPdfKey);
          if (!buffer) {
            issues.push({
              type: "MISSING_FILE",
              entity: "SignedPDF",
              entityId: sig.id,
              message: `PDF signé introuvable: ${sig.signedPdfKey}`,
            });
            continue;
          }

          const computedHash = sha256(buffer);
          if (computedHash !== sig.signedPdfHash) {
            issues.push({
              type: "HASH_MISMATCH",
              entity: "SignedPDF",
              entityId: sig.id,
              expected: sig.signedPdfHash,
              actual: computedHash,
              message: `Hash incorrect pour PDF signé ${sig.documentType}`,
            });
          } else {
            signaturesOk++;
          }
        } catch (err) {
          issues.push({
            type: "ERROR",
            entity: "SignedPDF",
            entityId: sig.id,
            message: `Erreur: ${err}`,
          });
        }
      } else if (sig.signedPdfKey) {
        // No stored hash to verify against, but file exists
        signaturesOk++;
      }
    }

    // ============================================================
    // 3. Verify Evidence Chain
    // ============================================================
    const chainVerification = await verifyEvidenceChain({
      garageId,
      entityType: "intervention",
      entityId: id,
    });

    if (!chainVerification.valid && chainVerification.brokenAt) {
      issues.push({
        type: "CHAIN_BROKEN",
        entity: "EvidenceChain",
        entityId: chainVerification.brokenAt,
        message: "La chaîne de preuves a été compromise",
      });
    }

    // ============================================================
    // 4. Verify Addenda Hash Chain
    // ============================================================
    let addendaOk = 0;
    let prevHash = "";
    for (const addendum of intervention.evidenceAddenda) {
      // Verify the sha256 of text
      const expectedSha = createHash("sha256").update(addendum.text, "utf8").digest("hex");
      if (expectedSha !== addendum.sha256) {
        issues.push({
          type: "HASH_MISMATCH",
          entity: "EvidenceAddendum",
          entityId: addendum.id,
          expected: addendum.sha256,
          actual: expectedSha,
          message: "Hash du texte incorrect",
        });
        continue;
      }

      // Verify chain link
      if (prevHash && addendum.prevHash !== prevHash) {
        issues.push({
          type: "CHAIN_BROKEN",
          entity: "EvidenceAddendum",
          entityId: addendum.id,
          expected: prevHash,
          actual: addendum.prevHash ?? undefined,
          message: "Chaîne d'addenda rompue",
        });
        continue;
      }

      prevHash = addendum.sha256;
      addendaOk++;
    }

    // ============================================================
    // Build Report
    // ============================================================
    const report: IntegrityReport = {
      interventionId: id,
      garageId,
      disputeStatus: intervention.disputeStatus,
      verifiedAt: new Date().toISOString(),
      summary: {
        documentVersionsChecked: intervention.documentVersions.length,
        documentVersionsOk,
        signaturesChecked: signatures.length,
        signaturesOk,
        chainValid: chainVerification.valid,
        chainEntries: chainVerification.entries,
        addendaChecked: intervention.evidenceAddenda.length,
        addendaOk,
      },
      issues,
      integrityOk: issues.length === 0,
    };

    // Log verification
    await prisma.auditLog.create({
      data: {
        entityType: "Intervention",
        entityId: id,
        action: "INTEGRITY_VERIFIED",
        userId: user.id,
        metadata: {
          integrityOk: report.integrityOk,
          issueCount: issues.length,
        },
      },
    });

    return NextResponse.json(success(report));
  } catch (err) {
    console.error("[Verify Integrity] Error:", err);
    return toErrorResponse(err);
  }
}
