/**
 * INSURANCE-READY-EXPORT-02: Insurance/Expert Export API
 * GET /api/interventions/[id]/export-insurance
 *
 * Creates a comprehensive ZIP for insurance/expert purposes containing:
 * - 00_README.txt - Instructions
 * - 01_LETTRE_ACCOMPAGNEMENT.pdf - Cover letter with garage branding
 * - 02_INDEX_PIECES.pdf - Index of all documents with SHA256
 * - 03_DOCUMENTS_SIGNES/ - Signed documents
 * - 04_PREUVES_SIGNATURE/ - Signature proofs
 * - 05_PHOTOS/ - Vehicle photos
 * - 06_TECH/ - Technical reports
 * - 07_AUDIT/ - Audit trail
 * - 08_CHAINE_PREUVE/ - Evidence chain
 * - 09_INTEGRITE/ - Manifest and integrity report
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { verifyEvidenceChain } from "@/lib/legal/evidenceChain";
import { 
  generateCoverLetterPdf, 
  generateIndexPdf, 
  generateReadmeTxt,
  type ExportFileInfo,
  type GarageInfo,
  type InterventionExportInfo 
} from "@/lib/pdf/insuranceExport";
import { decryptClientData } from "@/lib/encryption";
import { hasFeature, FeatureKey } from "@/lib/entitlements";
import { buildExpertPackData } from "@/lib/export/expertPack";
import { generateExpertDossierPdf } from "@/lib/pdf/expertDossier";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { PassThrough } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Max export size: 100MB
const MAX_EXPORT_SIZE = 100 * 1024 * 1024;

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
      const res = await fetch(fileUrl, { signal: AbortSignal.timeout(30000) });
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
  description: string;
  category: string;
  addedAt: string;
}

interface InsuranceManifest {
  version: "1.0";
  type: "INSURANCE_EXPORT";
  exportedAt: string;
  interventionId: string;
  interventionRef: string | null;
  garageId: number;
  garageName: string;
  vehiclePlate: string;
  vehicleVin: string | null;
  clientName: string;
  exportedBy: string;
  chainValid: boolean;
  chainEntries: number;
  files: ManifestFile[];
  totalFiles: number;
  totalBytes: number;
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));

    // Check feature gate
    if (user.garageId && !(await hasFeature(user.garageId, FeatureKey.EXPORT_ZIP))) {
      throw new RouteError(403, "PLAN_REQUIRED", "L'export ZIP nécessite un plan supérieur");
    }

    // Only OWNER, ADMIN or GARAGE can export
    if (user.role !== "ADMIN" && user.role !== "OWNER" && user.role !== "GARAGE") {
      throw new RouteError(403, "FORBIDDEN", "Seul le propriétaire peut exporter le dossier");
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
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    const garageId = intervention.garageId ?? user.garageId ?? -1;
    const exportDate = new Date();

    // Get evidence chain
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

    // Decrypt client data
    const clientRaw = intervention.vehicle.client as Record<string, unknown>;
    const client = decryptClientData(clientRaw) as {
      firstName: string;
      lastName: string;
    };
    const clientName = `${client.firstName} ${client.lastName}`.trim() || "Client";

    // Prepare garage info
    const garage = intervention.garage;
    const garageInfo: GarageInfo = {
      name: garage?.name || "Garage",
      displayName: garage?.displayName,
      addressLine1: garage?.addressLine1,
      addressLine2: garage?.addressLine2,
      postalCode: garage?.postalCode,
      city: garage?.city,
      phone: garage?.phone,
      email: garage?.email,
      siret: garage?.siret,
      logoKey: garage?.logoKey,
    };

    // Prepare intervention info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intv = intervention as any;
    const interventionInfo: InterventionExportInfo = {
      id,
      reference: intv.reference || null,
      vehiclePlate: intervention.vehicle.plate || "N/A",
      vehicleBrand: intervention.vehicle.brand || "N/A",
      vehicleModel: intervention.vehicle.model || "N/A",
      vehicleVin: intervention.vehicle.vin,
      clientName,
      mileageIn: intv.mileageIn || null,
      mileageOut: intv.mileageOut || null,
      entryDate: intv.entryDate || null,
      exitDate: intv.exitDate || null,
      status: intv.status || "UNKNOWN",
      description: intv.description || null,
      totalTTC: intv.totalTTC ? Number(intv.totalTTC) : null,
    };

    // Prepare archive
    const passThrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    let totalSize = 0;

    passThrough.on("data", (chunk) => {
      chunks.push(chunk);
      totalSize += chunk.length;
      if (totalSize > MAX_EXPORT_SIZE) {
        archive.abort();
        throw new RouteError(413, "TOO_LARGE", "Export trop volumineux (max 100 Mo)");
      }
    });
    archive.pipe(passThrough);

    const files: ExportFileInfo[] = [];
    const errors: string[] = [];

    // ============================================================
    // 03_DOCUMENTS_SIGNES/ - Signed document versions
    // ============================================================
    for (const version of intervention.documentVersions) {
      try {
        const buffer = await fetchFileBuffer(version.storageKey);
        if (buffer) {
          const computedHash = sha256(buffer);
          const hashMatch = computedHash === version.sha256;
          const fileName = `03_DOCUMENTS_SIGNES/${version.documentType}_v${version.versionNumber}_${version.id}.pdf`;
          
          archive.append(buffer, { name: fileName });
          files.push({
            path: fileName,
            sha256: computedHash,
            sizeBytes: buffer.length,
            description: `${version.documentType} version ${version.versionNumber} (${version.reason})`,
            category: "DOCUMENTS_SIGNES",
            createdAt: version.generatedAt,
          });
          
          if (!hashMatch) {
            errors.push(`INTEGRITY ERROR: ${fileName} hash mismatch`);
          }
        } else {
          errors.push(`Missing file: ${version.storageKey}`);
        }
      } catch (err) {
        errors.push(`Error reading ${version.storageKey}: ${err}`);
      }
    }

    // ============================================================
    // 04_PREUVES_SIGNATURE/ - Signature proofs
    // ============================================================
    for (const sig of signatureRequests) {
      if (sig.signedPdfKey) {
        try {
          const buffer = await fetchFileBuffer(sig.signedPdfKey);
          if (buffer) {
            const fileName = `04_PREUVES_SIGNATURE/signed_${sig.documentType}_rev${sig.revision || 1}_${sig.id}.pdf`;
            archive.append(buffer, { name: fileName });
            files.push({
              path: fileName,
              sha256: sig.signedPdfHash || sha256(buffer),
              sizeBytes: buffer.length,
              description: `Signed ${sig.documentType} revision ${sig.revision || 1}`,
              category: "PREUVES_SIGNATURE",
              createdAt: sig.signedAt ?? undefined,
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
    
    archive.append(signaturesJson, { name: "04_PREUVES_SIGNATURE/signatures.json" });
    files.push({
      path: "04_PREUVES_SIGNATURE/signatures.json",
      sha256: sha256String(signaturesJson),
      sizeBytes: Buffer.byteLength(signaturesJson),
      description: "Signature requests and events",
      category: "PREUVES_SIGNATURE",
    });

    // ============================================================
    // 05_PHOTOS/ - Attached photos
    // ============================================================
    for (const doc of intervention.documents) {
      if (doc.mime?.startsWith("image/")) {
        try {
          const buffer = await fetchFileBuffer(doc.fileUrl);
          if (buffer) {
            const ext = doc.fileName?.split(".").pop() || "jpg";
            const fileName = `05_PHOTOS/${doc.category || "DIVERS"}_${doc.id}.${ext}`;
            archive.append(buffer, { name: fileName });
            files.push({
              path: fileName,
              sha256: sha256(buffer),
              sizeBytes: buffer.length,
              description: doc.fileName || "Photo",
              category: "PHOTOS",
              createdAt: doc.createdAt,
            });
          }
        } catch (err) {
          errors.push(`Error reading photo ${doc.id}: ${err}`);
        }
      }
    }

    // ============================================================
    // 06_TECH/ - Technical reports
    // ============================================================
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const techReports = (intervention as any).techReports || [];
    for (const report of techReports) {
      if (report.fileKey) {
        try {
          const buffer = await fetchFileBuffer(report.fileKey);
          if (buffer) {
            const ext = report.fileName?.split(".").pop() || "pdf";
            const fileName = `06_TECH/${report.type || "RAPPORT"}_${report.id}.${ext}`;
            archive.append(buffer, { name: fileName });
            files.push({
              path: fileName,
              sha256: sha256(buffer),
              sizeBytes: buffer.length,
              description: report.title || report.fileName || "Technical report",
              category: "TECH",
              createdAt: report.createdAt,
            });
          }
        } catch (err) {
          errors.push(`Error reading tech report ${report.id}: ${err}`);
        }
      }
    }

    // ============================================================
    // 07_AUDIT/ - Audit trail
    // ============================================================
    const auditJson = JSON.stringify({
      interventionId: id,
      garageId,
      exportedAt: exportDate.toISOString(),
      logs: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        userId: log.userId,
        createdAt: log.createdAt,
        metadata: log.metadata,
      })),
    }, null, 2);
    
    archive.append(auditJson, { name: "07_AUDIT/audit.json" });
    files.push({
      path: "07_AUDIT/audit.json",
      sha256: sha256String(auditJson),
      sizeBytes: Buffer.byteLength(auditJson),
      description: "Complete audit trail",
      category: "AUDIT",
    });

    // ============================================================
    // 08_CHAINE_PREUVE/ - Evidence chain
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
      })),
    }, null, 2);
    
    archive.append(chainJson, { name: "08_CHAINE_PREUVE/evidence_chain.json" });
    files.push({
      path: "08_CHAINE_PREUVE/evidence_chain.json",
      sha256: sha256String(chainJson),
      sizeBytes: Buffer.byteLength(chainJson),
      description: "Tamper-evident evidence hash chain",
      category: "CHAINE_PREUVE",
    });

    // Addenda if any
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
      
      archive.append(addendaJson, { name: "08_CHAINE_PREUVE/addenda.json" });
      files.push({
        path: "08_CHAINE_PREUVE/addenda.json",
        sha256: sha256String(addendaJson),
        sizeBytes: Buffer.byteLength(addendaJson),
        description: "Append-only addenda",
        category: "CHAINE_PREUVE",
      });
    }

    // ============================================================
    // Now generate PDFs and calculate manifest
    // ============================================================

    // Pre-calculate manifest hash for index PDF (without cover/index/readme)
    const preliminaryManifest = {
      files: files.map(f => ({ path: f.path, sha256: f.sha256 })),
    };
    const manifestHash = sha256String(JSON.stringify(preliminaryManifest));

    // Generate Cover Letter PDF
    const coverLetter = await generateCoverLetterPdf({
      garage: garageInfo,
      intervention: interventionInfo,
      exportDate,
      filesCount: files.length + 4, // +4 for readme, cover, index, manifest
      totalSize: files.reduce((sum, f) => sum + f.sizeBytes, 0),
      chainValid: chainVerification.valid,
      chainEntries: chainVerification.entries,
    });

    archive.append(coverLetter.pdfBuffer, { name: "01_LETTRE_ACCOMPAGNEMENT.pdf" });
    files.unshift({
      path: "01_LETTRE_ACCOMPAGNEMENT.pdf",
      sha256: coverLetter.sha256,
      sizeBytes: coverLetter.pdfBuffer.length,
      description: "Lettre d'accompagnement avec en-tête garage",
      category: "ACCOMPAGNEMENT",
    });

    // INSURANCE-READY-EXPORT-03: Generate Expert Dossier PDF (PRO only)
    const hasExpertPack = user.garageId ? await hasFeature(user.garageId, FeatureKey.EXPERT_PACK) : false;
    if (hasExpertPack) {
      try {
        const packData = await buildExpertPackData(id, garageId);
        if (packData) {
          const expertPdf = await generateExpertDossierPdf({
            garage: garageInfo,
            vehicle: {
              plate: interventionInfo.vehiclePlate,
              brand: interventionInfo.vehicleBrand,
              model: interventionInfo.vehicleModel,
              vin: interventionInfo.vehicleVin,
              mileageIn: interventionInfo.mileageIn,
              mileageOut: interventionInfo.mileageOut,
            },
            intervention: {
              id,
              reference: interventionInfo.reference,
              entryDate: interventionInfo.entryDate ? new Date(interventionInfo.entryDate) : null,
              exitDate: interventionInfo.exitDate ? new Date(interventionInfo.exitDate) : null,
              clientName,
            },
            data: packData,
            exportDate,
            manifestHash,
            chainValid: chainVerification.valid,
            chainEntries: chainVerification.entries,
            maskVin: process.env.EXPERT_PACK_MASK_VIN === "true",
            fetchPhoto: fetchFileBuffer,
          });

          archive.append(expertPdf.pdfBuffer, { name: "01B_DOSSIER_EXPERT.pdf" });
          files.splice(1, 0, {
            path: "01B_DOSSIER_EXPERT.pdf",
            sha256: expertPdf.sha256,
            sizeBytes: expertPdf.pdfBuffer.length,
            description: "Dossier Expert - Timeline, photos, Q/R, intégrité",
            category: "EXPERT",
          });
        }
      } catch (expertErr) {
        // Log error but don't fail the export
        console.error("Expert pack generation failed:", expertErr);
        errors.push("EXPERT_PACK: Génération du dossier expert échouée");
      }
    }

    // Generate Index PDF
    const indexPdf = await generateIndexPdf({
      garage: garageInfo,
      intervention: interventionInfo,
      exportDate,
      files,
      manifestHash,
    });

    archive.append(indexPdf.pdfBuffer, { name: "02_INDEX_PIECES.pdf" });
    files.splice(1, 0, {
      path: "02_INDEX_PIECES.pdf",
      sha256: indexPdf.sha256,
      sizeBytes: indexPdf.pdfBuffer.length,
      description: "Index des pièces avec empreintes SHA256",
      category: "INDEX",
    });

    // Generate README
    const readme = generateReadmeTxt({
      garageName: garageInfo.displayName || garageInfo.name,
      interventionRef: interventionInfo.reference || interventionInfo.id,
      vehiclePlate: interventionInfo.vehiclePlate,
      exportDate,
    });

    archive.append(readme.content, { name: "00_README.txt" });
    files.unshift({
      path: "00_README.txt",
      sha256: readme.sha256,
      sizeBytes: Buffer.byteLength(readme.content),
      description: "Instructions de lecture du dossier",
      category: "README",
    });

    // ============================================================
    // 09_INTEGRITE/ - Final manifest and integrity report
    // ============================================================
    const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);

    const manifest: InsuranceManifest = {
      version: "1.0",
      type: "INSURANCE_EXPORT",
      exportedAt: exportDate.toISOString(),
      interventionId: id,
      interventionRef: interventionInfo.reference ?? null,
      garageId,
      garageName: garageInfo.displayName || garageInfo.name,
      vehiclePlate: interventionInfo.vehiclePlate,
      vehicleVin: interventionInfo.vehicleVin ?? null,
      clientName,
      exportedBy: user.email,
      chainValid: chainVerification.valid,
      chainEntries: chainVerification.entries,
      files: files.map(f => ({
        path: f.path,
        sha256: f.sha256,
        sizeBytes: f.sizeBytes,
        description: f.description,
        category: f.category,
        addedAt: f.createdAt ? new Date(f.createdAt).toISOString() : exportDate.toISOString(),
      })),
      totalFiles: files.length,
      totalBytes,
    };

    const manifestJson = JSON.stringify(manifest, null, 2);
    const finalManifestHash = sha256String(manifestJson);

    archive.append(manifestJson, { name: "09_INTEGRITE/manifest.json" });
    archive.append(finalManifestHash, { name: "09_INTEGRITE/manifest.sha256" });

    // Integrity report
    const integrityLines = [
      "===============================================================================",
      "              RAPPORT D'INTÉGRITÉ - EXPORT ASSURANCE",
      "===============================================================================",
      "",
      `Date d'export    : ${exportDate.toISOString()}`,
      `Intervention     : ${interventionInfo.reference || id}`,
      `Véhicule         : ${interventionInfo.vehiclePlate}`,
      `Garage           : ${garageInfo.displayName || garageInfo.name}`,
      `Garage ID        : ${garageId}`,
      `Exporté par      : ${user.email}`,
      "",
      "-------------------------------------------------------------------------------",
      "                    VÉRIFICATION CHAÎNE DE PREUVES",
      "-------------------------------------------------------------------------------",
      "",
      `Chaîne valide    : ${chainVerification.valid ? "OUI ✓" : "NON ✗"}`,
      `Entrées          : ${chainVerification.entries}`,
      chainVerification.brokenAt ? `Rupture à       : ${chainVerification.brokenAt}` : "",
      "",
      "-------------------------------------------------------------------------------",
      "                          FICHIERS INCLUS",
      "-------------------------------------------------------------------------------",
      "",
      `Total fichiers   : ${files.length}`,
      `Taille totale    : ${totalBytes} octets (${(totalBytes / 1024 / 1024).toFixed(2)} Mo)`,
      "",
    ];

    // Group files by category
    const categories = [...new Set(files.map(f => f.category))];
    for (const cat of categories) {
      const catFiles = files.filter(f => f.category === cat);
      integrityLines.push(`[${cat}] - ${catFiles.length} fichier(s)`);
      for (const f of catFiles) {
        integrityLines.push(`  ${f.path}`);
        integrityLines.push(`    SHA256: ${f.sha256}`);
        integrityLines.push(`    Taille: ${f.sizeBytes} octets`);
      }
      integrityLines.push("");
    }

    if (errors.length > 0) {
      integrityLines.push("-------------------------------------------------------------------------------");
      integrityLines.push("                        ERREURS DÉTECTÉES");
      integrityLines.push("-------------------------------------------------------------------------------");
      integrityLines.push("");
      for (const err of errors) {
        integrityLines.push(`  ⚠ ${err}`);
      }
      integrityLines.push("");
    }

    integrityLines.push("-------------------------------------------------------------------------------");
    integrityLines.push("                          CERTIFICATION");
    integrityLines.push("-------------------------------------------------------------------------------");
    integrityLines.push("");
    integrityLines.push("Ce dossier a été exporté depuis Motorsafe.");
    integrityLines.push("L'intégrité des documents peut être vérifiée via les empreintes SHA256.");
    integrityLines.push("La chaîne de preuves est cryptographiquement inviolable.");
    integrityLines.push("");
    integrityLines.push(`Hash du manifest : ${finalManifestHash}`);
    integrityLines.push("");
    integrityLines.push("===============================================================================");

    const integrityReport = integrityLines.join("\n");
    archive.append(integrityReport, { name: "09_INTEGRITE/integrity_report.txt" });

    // Finalize archive
    await archive.finalize();

    // Wait for all chunks
    await new Promise<void>((resolve) => passThrough.on("end", resolve));
    const zipBuffer = Buffer.concat(chunks);

    // Generate filename
    const plateClean = interventionInfo.vehiclePlate.replace(/[^A-Z0-9]/gi, "-");
    const dateStr = exportDate.toISOString().split("T")[0].replace(/-/g, "");
    const filename = `SAFE-EXPORT_${dateStr}_${plateClean}_${id.substring(0, 8)}.zip`;

    // Log export event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EXPORT_INSURANCE_ZIP",
        entityType: "Intervention",
        entityId: id,
        metadata: {
          filesCount: files.length,
          totalBytes,
          manifestHash: finalManifestHash,
          chainValid: chainVerification.valid,
        },
      },
    });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
        "X-Manifest-Hash": finalManifestHash,
        "X-Chain-Valid": String(chainVerification.valid),
        "X-Files-Count": String(files.length),
      },
    });
  } catch (err) {
    console.error("[Insurance Export] Error:", err);
    return toErrorResponse(err);
  }
}
