/**
 * INSURANCE-READY-EXPORT-02: Public Share Download Route
 * GET /api/share/export/[token]
 *
 * Downloads the insurance export ZIP using a share token.
 * No authentication required - token is the auth.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
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
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { PassThrough } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Max export size: 100MB
const MAX_EXPORT_SIZE = 100 * 1024 * 1024;

type Ctx = { params: Promise<{ token: string }> };

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

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;

    if (!token || typeof token !== "string" || token.length !== 64) {
      return NextResponse.json(failure("Lien invalide"), { status: 400 });
    }

    // Hash the token to find it in DB
    const tokenHash = sha256String(token);

    // Find the download token
    const downloadToken = await prisma.downloadToken.findUnique({
      where: { tokenHash },
      include: {
        intervention: {
          include: {
            vehicle: { include: { client: true } },
            documents: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
            documentVersions: { orderBy: { generatedAt: "asc" } },
            evidenceAddenda: { orderBy: { createdAt: "asc" } },
            garage: true,
          },
        },
      },
    });

    if (!downloadToken) {
      return NextResponse.json(failure("Lien invalide ou expiré"), { status: 404 });
    }

    if (downloadToken.purpose !== "INSURANCE_EXPORT") {
      return NextResponse.json(failure("Type de lien non valide"), { status: 400 });
    }

    // Check expiry
    if (downloadToken.expiresAt < new Date()) {
      return NextResponse.json(failure("Ce lien a expiré"), { status: 410 });
    }

    const intervention = downloadToken.intervention;
    if (!intervention || intervention.deletedAt) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    const garageId = intervention.garageId ?? -1;
    const id = intervention.id;
    const exportDate = new Date();

    // Mark token as used
    if (!downloadToken.usedAt) {
      await prisma.downloadToken.update({
        where: { id: downloadToken.id },
        data: { usedAt: new Date() },
      });
    }

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
      }
    });
    archive.pipe(passThrough);

    const files: ExportFileInfo[] = [];
    const errors: string[] = [];

    // Build the same ZIP structure as export-insurance route
    // 03_DOCUMENTS_SIGNES/
    for (const version of intervention.documentVersions) {
      try {
        const buffer = await fetchFileBuffer(version.storageKey);
        if (buffer) {
          const computedHash = sha256(buffer);
          const fileName = `03_DOCUMENTS_SIGNES/${version.documentType}_v${version.versionNumber}_${version.id}.pdf`;
          archive.append(buffer, { name: fileName });
          files.push({
            path: fileName,
            sha256: computedHash,
            sizeBytes: buffer.length,
            description: `${version.documentType} version ${version.versionNumber}`,
            category: "DOCUMENTS_SIGNES",
            createdAt: version.generatedAt,
          });
        }
      } catch (err) {
        errors.push(`Error: ${err}`);
      }
    }

    // 04_PREUVES_SIGNATURE/
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
              description: `Signed ${sig.documentType}`,
              category: "PREUVES_SIGNATURE",
              createdAt: sig.signedAt ?? undefined,
            });
          }
        } catch {
          // Skip
        }
      }
    }

    // Signatures JSON
    const signaturesJson = JSON.stringify(signatureRequests.map(sig => ({
      id: sig.id,
      documentType: sig.documentType,
      status: sig.status,
      signedAt: sig.signedAt,
      events: sig.events.map(e => ({ type: e.type, at: e.at })),
    })), null, 2);
    archive.append(signaturesJson, { name: "04_PREUVES_SIGNATURE/signatures.json" });
    files.push({
      path: "04_PREUVES_SIGNATURE/signatures.json",
      sha256: sha256String(signaturesJson),
      sizeBytes: Buffer.byteLength(signaturesJson),
      description: "Signature events",
      category: "PREUVES_SIGNATURE",
    });

    // 05_PHOTOS/
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
        } catch {
          // Skip
        }
      }
    }

    // 08_CHAINE_PREUVE/
    const chainJson = JSON.stringify({
      interventionId: id,
      verification: chainVerification,
      entries: evidenceChain.map(e => ({
        id: e.id,
        eventType: e.eventType,
        chainHash: e.chainHash,
        createdAt: e.createdAt,
      })),
    }, null, 2);
    archive.append(chainJson, { name: "08_CHAINE_PREUVE/evidence_chain.json" });
    files.push({
      path: "08_CHAINE_PREUVE/evidence_chain.json",
      sha256: sha256String(chainJson),
      sizeBytes: Buffer.byteLength(chainJson),
      description: "Evidence hash chain",
      category: "CHAINE_PREUVE",
    });

    // Generate PDFs
    const preliminaryManifest = { files: files.map(f => ({ path: f.path, sha256: f.sha256 })) };
    const manifestHash = sha256String(JSON.stringify(preliminaryManifest));

    const coverLetter = await generateCoverLetterPdf({
      garage: garageInfo,
      intervention: interventionInfo,
      exportDate,
      filesCount: files.length + 4,
      totalSize: files.reduce((sum, f) => sum + f.sizeBytes, 0),
      chainValid: chainVerification.valid,
      chainEntries: chainVerification.entries,
    });
    archive.append(coverLetter.pdfBuffer, { name: "01_LETTRE_ACCOMPAGNEMENT.pdf" });
    files.unshift({
      path: "01_LETTRE_ACCOMPAGNEMENT.pdf",
      sha256: coverLetter.sha256,
      sizeBytes: coverLetter.pdfBuffer.length,
      description: "Lettre d'accompagnement",
      category: "ACCOMPAGNEMENT",
    });

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
      description: "Index des pièces",
      category: "INDEX",
    });

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
      description: "Instructions",
      category: "README",
    });

    // 09_INTEGRITE/
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
      exportedBy: "SHARE_LINK",
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
    const integrityReport = [
      "RAPPORT D'INTÉGRITÉ - EXPORT VIA LIEN DE PARTAGE",
      "",
      `Date: ${exportDate.toISOString()}`,
      `Intervention: ${interventionInfo.reference || id}`,
      `Véhicule: ${interventionInfo.vehiclePlate}`,
      `Chaîne valide: ${chainVerification.valid ? "OUI" : "NON"}`,
      `Fichiers: ${files.length}`,
      `Hash manifest: ${finalManifestHash}`,
    ].join("\n");
    archive.append(integrityReport, { name: "09_INTEGRITE/integrity_report.txt" });

    await archive.finalize();
    await new Promise<void>((resolve) => passThrough.on("end", resolve));
    const zipBuffer = Buffer.concat(chunks);

    const plateClean = interventionInfo.vehiclePlate.replace(/[^A-Z0-9]/gi, "-");
    const dateStr = exportDate.toISOString().split("T")[0].replace(/-/g, "");
    const filename = `SAFE-EXPORT_${dateStr}_${plateClean}_${id.substring(0, 8)}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
        "X-Manifest-Hash": finalManifestHash,
      },
    });
  } catch (err) {
    console.error("[Share Export Download] Error:", err);
    return NextResponse.json(failure("Erreur lors du téléchargement"), { status: 500 });
  }
}
