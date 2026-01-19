/**
 * EVIDENCE-LOCKDOWN-01: Forensic Export for Dispute Mode
 * GET /api/interventions/[id]/export-forensic
 *
 * Creates a comprehensive ZIP for legal/insurance purposes containing:
 * - 00_manifest/manifest.json - File list with sha256 hashes
 * - 01_documents/ - All PDF versions
 * - 02_signatures/ - Signed documents and signature proofs
 * - 03_photos/ - Attached photos
 * - 04_audit/audit.json - Complete audit trail
 * - 05_chain/evidence_chain.json - Tamper-evident hash chain
 * - 06_integrity/integrity_report.txt - Verification report
 * - 07_addenda/addenda.json - Append-only addenda
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { verifyEvidenceChain } from "@/lib/legal/evidenceChain";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { PassThrough } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function sha256String(str: string): string {
  return createHash("sha256").update(str, "utf8").digest("hex");
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
    // Direct key (e.g., "uploads/123/...")
    const abs = path.join(process.cwd(), fileUrl);
    return await readFile(abs);
  } catch {
    return null;
  }
}

interface ManifestFile {
  path: string;
  sha256: string;
  sizeBytes: number;
  description?: string;
}

interface ForensicManifest {
  version: "1.0";
  exportedAt: string;
  interventionId: string;
  garageId: number;
  disputeStatus: string | null;
  disputeOpenedAt: string | null;
  disputeReason: string | null;
  exportedBy: string;
  files: ManifestFile[];
  totalFiles: number;
  totalBytes: number;
  manifestHash: string;
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    
    // Only OWNER or ADMIN can export forensic
    if (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "GARAGE") {
      throw new RouteError(403, "FORBIDDEN", "Seul le propriétaire peut exporter le dossier forensic");
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    // Get intervention with all related data
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
        documentVersions: { orderBy: { generatedAt: "asc" } },
        evidenceAddenda: { orderBy: { createdAt: "asc" } },
        garage: true,
        incidentCase: true,
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    const garageId = intervention.garageId ?? user.garageId ?? -1;

    // Get evidence chain entries
    const evidenceChain = await prisma.evidenceChain.findMany({
      where: { garageId, entityType: "intervention", entityId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        eventType: true,
        payload: true,
        payloadHash: true,
        previousHash: true,
        chainHash: true,
        userId: true,
        ip: true,
        reason: true,
        createdAt: true,
      },
    });

    // Verify chain integrity
    const chainVerification = await verifyEvidenceChain({
      garageId,
      entityType: "intervention",
      entityId: id,
    });

    // Get signature requests
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: { documentId: id, garageId },
      include: { events: { orderBy: { at: "asc" } } },
      orderBy: { createdAt: "asc" },
    });

    // Get audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: "Intervention", entityId: id },
      orderBy: { createdAt: "asc" },
    });

    // Prepare archive
    const passThrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    passThrough.on("data", (chunk) => chunks.push(chunk));
    archive.pipe(passThrough);

    const files: ManifestFile[] = [];
    const errors: string[] = [];

    // ============================================================
    // 01_documents/ - Document versions
    // ============================================================
    for (const version of intervention.documentVersions) {
      try {
        const buffer = await fetchFileBuffer(version.storageKey);
        if (buffer) {
          const computedHash = sha256(buffer);
          const hashMatch = computedHash === version.sha256;
          const fileName = `01_documents/${version.documentType}_v${version.versionNumber}_${version.id}.pdf`;
          
          archive.append(buffer, { name: fileName });
          files.push({
            path: fileName,
            sha256: computedHash,
            sizeBytes: buffer.length,
            description: `${version.documentType} version ${version.versionNumber} (${version.reason})`,
          });
          
          if (!hashMatch) {
            errors.push(`INTEGRITY ERROR: ${fileName} hash mismatch (expected ${version.sha256}, got ${computedHash})`);
          }
        } else {
          errors.push(`Missing file: ${version.storageKey}`);
        }
      } catch (err) {
        errors.push(`Error reading ${version.storageKey}: ${err}`);
      }
    }

    // ============================================================
    // 02_signatures/ - Signed PDFs and signature proofs
    // ============================================================
    for (const sig of signatureRequests) {
      if (sig.signedPdfKey) {
        try {
          const buffer = await fetchFileBuffer(sig.signedPdfKey);
          if (buffer) {
            const fileName = `02_signatures/signed_${sig.documentType}_rev${sig.revision || 1}_${sig.id}.pdf`;
            archive.append(buffer, { name: fileName });
            files.push({
              path: fileName,
              sha256: sig.signedPdfHash || sha256(buffer),
              sizeBytes: buffer.length,
              description: `Signed ${sig.documentType} revision ${sig.revision || 1}`,
            });
          }
        } catch (err) {
          errors.push(`Error reading signed PDF ${sig.id}: ${err}`);
        }
      }
    }

    // Signature events JSON
    const signaturesJson = JSON.stringify(signatureRequests.map(sig => ({
      id: sig.id,
      documentType: sig.documentType,
      revision: sig.revision,
      status: sig.status,
      createdAt: sig.createdAt,
      sentAt: sig.sentAt,
      lastViewedAt: sig.lastViewedAt,
      signedAt: sig.signedAt,
      signerEmailMasked: sig.signerEmail ? sig.signerEmail.replace(/(.{2}).*@/, "$1***@") : null,
      events: sig.events.map(e => ({
        type: e.type,
        at: e.at,
        ipMasked: e.ip ? e.ip.replace(/\d+$/, "xxx") : null,
      })),
      legalSnapshotHash: sig.legalSnapshotHash,
      pdfHash: sig.pdfHash,
      signedPdfHash: sig.signedPdfHash,
    })), null, 2);
    
    archive.append(signaturesJson, { name: "02_signatures/signatures.json" });
    files.push({
      path: "02_signatures/signatures.json",
      sha256: sha256String(signaturesJson),
      sizeBytes: Buffer.byteLength(signaturesJson),
      description: "Signature requests and events",
    });

    // ============================================================
    // 03_photos/ - Attached photos
    // ============================================================
    for (const doc of intervention.documents) {
      if (doc.mime.startsWith("image/")) {
        try {
          const buffer = await fetchFileBuffer(doc.fileUrl);
          if (buffer) {
            const ext = doc.fileName.split(".").pop() || "jpg";
            const fileName = `03_photos/${doc.category || "DIVERS"}_${doc.id}.${ext}`;
            archive.append(buffer, { name: fileName });
            files.push({
              path: fileName,
              sha256: sha256(buffer),
              sizeBytes: buffer.length,
              description: doc.fileName,
            });
          }
        } catch (err) {
          errors.push(`Error reading photo ${doc.id}: ${err}`);
        }
      }
    }

    // ============================================================
    // 04_audit/audit.json - Audit trail
    // ============================================================
    const auditJson = JSON.stringify({
      interventionId: id,
      garageId,
      exportedAt: new Date().toISOString(),
      logs: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        userId: log.userId,
        createdAt: log.createdAt,
        metadata: log.metadata,
      })),
    }, null, 2);
    
    archive.append(auditJson, { name: "04_audit/audit.json" });
    files.push({
      path: "04_audit/audit.json",
      sha256: sha256String(auditJson),
      sizeBytes: Buffer.byteLength(auditJson),
      description: "Complete audit trail",
    });

    // ============================================================
    // 05_chain/evidence_chain.json - Hash chain
    // ============================================================
    const chainJson = JSON.stringify({
      interventionId: id,
      garageId,
      verification: chainVerification,
      entries: evidenceChain.map(e => ({
        id: e.id,
        eventType: e.eventType,
        payloadHash: e.payloadHash,
        previousHash: e.previousHash,
        chainHash: e.chainHash,
        createdAt: e.createdAt,
        reason: e.reason,
        // Payload omitted for privacy, hash is proof
      })),
    }, null, 2);
    
    archive.append(chainJson, { name: "05_chain/evidence_chain.json" });
    files.push({
      path: "05_chain/evidence_chain.json",
      sha256: sha256String(chainJson),
      sizeBytes: Buffer.byteLength(chainJson),
      description: "Tamper-evident evidence hash chain",
    });

    // ============================================================
    // 06_integrity/integrity_report.txt - Verification report
    // ============================================================
    const integrityLines = [
      "=== RAPPORT D'INTÉGRITÉ FORENSIC ===",
      `Date d'export: ${new Date().toISOString()}`,
      `Intervention: ${id}`,
      `Garage ID: ${garageId}`,
      `Statut litige: ${intervention.disputeStatus || "Aucun"}`,
      `Litige ouvert le: ${intervention.disputeOpenedAt?.toISOString() || "N/A"}`,
      `Raison litige: ${intervention.disputeReason || "N/A"}`,
      "",
      "=== VÉRIFICATION CHAÎNE DE PREUVES ===",
      `Chaîne valide: ${chainVerification.valid ? "OUI ✓" : "NON ✗"}`,
      `Nombre d'entrées: ${chainVerification.entries}`,
      chainVerification.brokenAt ? `Rupture détectée à: ${chainVerification.brokenAt}` : "",
      "",
      "=== FICHIERS INCLUS ===",
      `Total fichiers: ${files.length}`,
      "",
    ];
    
    for (const f of files) {
      integrityLines.push(`${f.path}`);
      integrityLines.push(`  SHA256: ${f.sha256}`);
      integrityLines.push(`  Taille: ${f.sizeBytes} octets`);
      integrityLines.push("");
    }

    if (errors.length > 0) {
      integrityLines.push("=== ERREURS DÉTECTÉES ===");
      for (const err of errors) {
        integrityLines.push(`  - ${err}`);
      }
    }

    integrityLines.push("");
    integrityLines.push("=== CERTIFICATION ===");
    integrityLines.push("Ce dossier a été exporté depuis Motorsafe.");
    integrityLines.push("L'intégrité des documents peut être vérifiée via les hashes SHA256.");
    integrityLines.push("La chaîne de preuves est inviolable et toute modification est détectable.");

    const integrityReport = integrityLines.join("\n");
    archive.append(integrityReport, { name: "06_integrity/integrity_report.txt" });
    files.push({
      path: "06_integrity/integrity_report.txt",
      sha256: sha256String(integrityReport),
      sizeBytes: Buffer.byteLength(integrityReport),
      description: "Integrity verification report",
    });

    // ============================================================
    // 07_addenda/addenda.json - Append-only addenda
    // ============================================================
    if (intervention.evidenceAddenda.length > 0) {
      const addendaJson = JSON.stringify({
        interventionId: id,
        addenda: intervention.evidenceAddenda.map(a => ({
          id: a.id,
          text: a.text,
          sha256: a.sha256,
          prevHash: a.prevHash,
          createdAt: a.createdAt,
          createdByUserId: a.createdByUserId,
        })),
      }, null, 2);
      
      archive.append(addendaJson, { name: "07_addenda/addenda.json" });
      files.push({
        path: "07_addenda/addenda.json",
        sha256: sha256String(addendaJson),
        sizeBytes: Buffer.byteLength(addendaJson),
        description: "Append-only addenda (notes added during dispute)",
      });
    }

    // ============================================================
    // 00_manifest/manifest.json - Final manifest
    // ============================================================
    const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);
    
    // Create manifest without hash first
    const manifestData: Omit<ForensicManifest, "manifestHash"> = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      interventionId: id,
      garageId,
      disputeStatus: intervention.disputeStatus,
      disputeOpenedAt: intervention.disputeOpenedAt?.toISOString() || null,
      disputeReason: intervention.disputeReason,
      exportedBy: user.email,
      files,
      totalFiles: files.length,
      totalBytes,
    };
    
    // Compute manifest hash
    const manifestHash = sha256String(JSON.stringify(manifestData));
    const manifest: ForensicManifest = { ...manifestData, manifestHash };
    
    const manifestJson = JSON.stringify(manifest, null, 2);
    archive.append(manifestJson, { name: "00_manifest/manifest.json" });

    // Finalize archive
    await archive.finalize();

    // Wait for all chunks
    await new Promise<void>((resolve) => passThrough.on("end", resolve));
    const zipBuffer = Buffer.concat(chunks);

    // Return ZIP
    const filename = `forensic_${id}_${new Date().toISOString().split("T")[0]}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
        "X-Manifest-Hash": manifestHash,
      },
    });
  } catch (err) {
    console.error("[Forensic Export] Error:", err);
    return toErrorResponse(err);
  }
}
