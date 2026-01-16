import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { buildOrderMasterPdf } from "@/lib/pdf/orderMaster";
import { buildLegalMemoPdf } from "@/lib/pdf/legalMemo";
import { Buffer } from "buffer";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { PassThrough } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function formatDate(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  const masked = local.length > 2 ? `${local.slice(0, 2)}***` : "***";
  return `${masked}@${domain}`;
}

// Fetch file content from local storage or S3
async function fetchFileBuffer(fileUrl: string): Promise<Buffer | null> {
  try {
    // Local file: /api/uploads/file/uploads/...
    if (fileUrl.startsWith("/api/uploads/file/")) {
      const key = fileUrl.replace("/api/uploads/file/", "");
      const abs = path.join(process.cwd(), "uploads", key);
      return await readFile(abs);
    }

    // External URL (S3, etc.)
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      const res = await fetch(fileUrl);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    return null;
  } catch {
    return null;
  }
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

// ============================================================
// Types for audit.json
// ============================================================

interface AuditFile {
  path: string;
  sha256: string;
  sizeBytes: number;
}

interface AuditSignature {
  documentType: string;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  signerName: string | null;
  signerEmailMasked: string | null;
  pdfHash: string | null;
  signedPdfHash: string | null;
  legalSnapshotHash: string | null;
  revision: number;
}

interface AuditJson {
  exportVersion: string;
  generatedAt: string;
  interventionId: string;
  garageId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  closedAt: string | null;
  status: string;
  isSigned: boolean;
  signatures: AuditSignature[];
  files: AuditFile[];
  errors: string[];
}

// ============================================================
// GET /api/interventions/[id]/export
// Export ZIP "justice-ready" with signed PDF, attachments, audit
// ============================================================

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Feature gate: EXPORT_ZIP required
    if (user.role !== "ADMIN") {
      await requireFeature(getTenantId(user), FeatureKey.EXPORT_ZIP);
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        garage: true,
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Fetch all signature requests for this intervention (including events)
    // SECURITY: Filter by garageId to prevent cross-tenant data leakage
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: user.role === "ADMIN"
        ? { documentId: id }
        : { documentId: id, garageId: user.garageId ?? -1 },
      include: {
        events: { orderBy: { at: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Find signed signature (highest revision with status SIGNED)
    const signedSig = signatureRequests
      .filter((s) => s.status === "SIGNED")
      .sort((a, b) => (b.revision || 1) - (a.revision || 1))[0];

    const isClosed = intervention.status === "DONE";

    // Prepare archive
    const passThrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    passThrough.on("data", (chunk) => chunks.push(chunk));
    archive.pipe(passThrough);

    const files: AuditFile[] = [];
    const errors: string[] = [];

    // ============================================================
    // 01_documents/ - Main PDFs
    // ============================================================

    // 01_document_signe.pdf - Signed PDF if available
    if (signedSig?.signedPdfKey) {
      try {
        const signedPdfBuffer = await fetchFileBuffer(`/api/uploads/file/${signedSig.signedPdfKey}`);
        if (signedPdfBuffer) {
          const filePath = "01_documents/01_document_signe.pdf";
          archive.append(signedPdfBuffer, { name: filePath });
          files.push({ path: filePath, sha256: signedSig.signedPdfHash || sha256(signedPdfBuffer), sizeBytes: signedPdfBuffer.length });
        } else {
          errors.push("Signed PDF key exists but file not found");
        }
      } catch (err) {
        errors.push(`Failed to fetch signed PDF: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    // 02_ordre_reparation_preview.pdf - If not signed, include preview
    if (!signedSig) {
      try {
        const orderPdf = await buildOrderMasterPdf(id, {});
        const filePath = "01_documents/02_ordre_reparation_preview.pdf";
        archive.append(orderPdf.pdfBuffer, { name: filePath });
        files.push({ path: filePath, sha256: orderPdf.sha256, sizeBytes: orderPdf.pdfBuffer.length });
      } catch (err) {
        errors.push(`Failed to generate order preview: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    // NOTE: Quote/Invoice PDFs are generated on-demand and not stored
    // If needed in the future, add pdfKey fields to Quote/Invoice models

    // 03_pv_restitution.pdf - If closed, try to generate delivery PDF
    if (isClosed) {
      try {
        // Use internal fetch to get delivery PDF
        const deliveryUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/interventions/${id}/delivery/pdf`;
        const deliveryRes = await fetch(deliveryUrl, {
          headers: { Cookie: req.headers.get("cookie") || "" },
        });
        if (deliveryRes.ok) {
          const buffer = Buffer.from(await deliveryRes.arrayBuffer());
          const filePath = "01_documents/03_pv_restitution.pdf";
          archive.append(buffer, { name: filePath });
          files.push({ path: filePath, sha256: sha256(buffer), sizeBytes: buffer.length });
        }
      } catch (err) {
        errors.push(`Failed to generate delivery PDF: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    // 04_dossier_intervention.pdf - Summary PDF
    try {
      const dossierUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/interventions/${id}/pdf`;
      const dossierRes = await fetch(dossierUrl, {
        headers: { Cookie: req.headers.get("cookie") || "" },
      });
      if (dossierRes.ok) {
        const buffer = Buffer.from(await dossierRes.arrayBuffer());
        const filePath = "01_documents/04_dossier_intervention.pdf";
        archive.append(buffer, { name: filePath });
        files.push({ path: filePath, sha256: sha256(buffer), sizeBytes: buffer.length });
      }
    } catch (err) {
      errors.push(`Failed to fetch dossier PDF: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // ============================================================
    // 02_pieces_jointes/ - All attached documents
    // ============================================================

    let pieceIndex = 0;
    for (const doc of intervention.documents) {
      try {
        const buffer = await fetchFileBuffer(doc.fileUrl);
        if (!buffer) {
          errors.push(`Document not found: ${doc.fileName}`);
          continue;
        }

        pieceIndex++;
        const safeName = doc.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `02_pieces_jointes/${String(pieceIndex).padStart(2, "0")}_${safeName}`;
        archive.append(buffer, { name: filePath });
        files.push({ path: filePath, sha256: sha256(buffer), sizeBytes: buffer.length });
      } catch {
        errors.push(`Failed to fetch document: ${doc.fileName}`);
      }
    }

    // ============================================================
    // 03_preuves/ - Legal memo, audit.json, hashes.txt
    // ============================================================

    // 01_legal_memo.pdf - Legal proof memo (signed clauses, hashes, timeline)
    try {
      const legalMemo = await buildLegalMemoPdf(id);
      const filePath = "03_preuves/01_legal_memo.pdf";
      archive.append(legalMemo.pdfBuffer, { name: filePath });
      files.push({ path: filePath, sha256: legalMemo.sha256, sizeBytes: legalMemo.pdfBuffer.length });
    } catch (err) {
      errors.push(`Failed to generate legal memo: ${err instanceof Error ? err.message : "unknown"}`);
    }

    // Build signatures audit data
    const signaturesAudit: AuditSignature[] = signatureRequests.map((sig) => {
      const sentEvent = sig.events.find((e) => e.type === "SENT");
      const viewedEvent = sig.events.find((e) => e.type === "VIEWED");
      const signedEvent = sig.events.find((e) => e.type === "SIGNED");

      return {
        documentType: sig.documentType,
        status: sig.status,
        sentAt: formatDate(sig.sentAt || sentEvent?.at),
        viewedAt: formatDate(sig.lastViewedAt || viewedEvent?.at),
        signedAt: formatDate(sig.signedAt || signedEvent?.at),
        signerName: sig.signerNameDeclared || null,
        signerEmailMasked: maskEmail(sig.signerEmail),
        pdfHash: sig.pdfHash || null,
        signedPdfHash: sig.signedPdfHash || null,
        legalSnapshotHash: sig.legalSnapshotHash || null,
        revision: sig.revision || 1,
      };
    });

    // Build audit.json
    const auditJson: AuditJson = {
      exportVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      interventionId: intervention.id,
      garageId: intervention.garageId,
      createdAt: formatDate(intervention.createdAt),
      updatedAt: formatDate(intervention.updatedAt),
      closedAt: formatDate(intervention.closedAt),
      status: intervention.status,
      isSigned: !!signedSig,
      signatures: signaturesAudit,
      files: [], // Will be populated after all files added
      errors,
    };

    // Add audit.json (with files list)
    auditJson.files = files.map((f) => ({ ...f }));
    const auditBuffer = Buffer.from(JSON.stringify(auditJson, null, 2), "utf-8");
    const auditPath = "03_preuves/audit.json";
    archive.append(auditBuffer, { name: auditPath });
    files.push({ path: auditPath, sha256: sha256(auditBuffer), sizeBytes: auditBuffer.length });

    // Generate hashes.txt
    const hashesContent = [
      `HASHES SHA-256 - Dossier Intervention`,
      `${"=".repeat(60)}`,
      `Intervention: ${intervention.id}`,
      `Généré le: ${new Date().toISOString()}`,
      ``,
      ...files.map((f) => `${f.sha256}  ${f.path}`),
      ``,
    ].join("\n");
    const hashesBuffer = Buffer.from(hashesContent, "utf-8");
    archive.append(hashesBuffer, { name: "03_preuves/hashes.txt" });

    // Finalize archive
    await archive.finalize();
    await new Promise<void>((resolve) => passThrough.on("end", resolve));

    const zipBuffer = Buffer.concat(chunks);
    const plate = intervention.vehicle.plate.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `dossier-intervention-${plate}-${intervention.id.slice(0, 8)}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erreur API GET /api/interventions/[id]/export :", err);
    return toErrorResponse(err);
  }
}
