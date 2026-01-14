import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { requireActiveSubscription, requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { decryptClientData } from "@/lib/encryption";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
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
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR");
}

function asText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

// Generate PDF buffer (simplified version of the main PDF route)
async function generatePdfBuffer(intervention: any, client: any): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer | Uint8Array) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;

  const row = (label: string, value: string) => {
    const labelWidth = 150;
    const valueWidth = right - left - labelWidth;
    const y = doc.y;
    doc.font("Helvetica-Bold").text(label, left, y, { width: labelWidth });
    doc.font("Helvetica").text(value, left + labelWidth, y, { width: valueWidth });
    doc.moveDown(0.3);
  };

  doc.fontSize(18).font("Helvetica-Bold").text("MotorSafe", left, doc.y);
  doc.fontSize(10).font("Helvetica").text(formatDate(new Date()), right - 160, doc.y - 18, {
    width: 160,
    align: "right",
  });

  doc.moveDown(0.4);
  doc.fontSize(16).font("Helvetica-Bold").text("Dossier d'intervention");
  doc.moveTo(left, doc.y + 4).lineTo(right, doc.y + 4).strokeColor("#444").stroke();
  doc.moveDown(0.8);

  row("ID intervention", intervention.id);
  row("Cree le", formatDate(intervention.createdAt));
  row("Statut", intervention.status);

  doc.moveDown(0.4);
  doc.fontSize(13).font("Helvetica-Bold").text("Client", { underline: true });
  doc.moveDown(0.2);
  row("Nom", `${client.firstName} ${client.lastName}`);
  row("Client ID", String(client.id));

  doc.moveDown(0.3);
  doc.fontSize(13).font("Helvetica-Bold").text("Vehicule", { underline: true });
  doc.moveDown(0.2);
  row("Immatriculation", intervention.vehicle.plate);
  row("Marque / Modele", `${intervention.vehicle.brand} ${intervention.vehicle.model}`);
  row("VIN", asText(intervention.vehicle.vin));

  doc.moveDown(0.3);
  doc.fontSize(13).font("Helvetica-Bold").text("Intervention", { underline: true });
  doc.moveDown(0.2);
  row("Type", intervention.type);
  row("Kilometrage", intervention.odometerKm ? `${intervention.odometerKm} km` : "-");

  if (intervention.agreementAt) {
    doc.moveDown(0.3);
    doc.fontSize(13).font("Helvetica-Bold").text("Accord client", { underline: true });
    doc.moveDown(0.2);
    row("Date accord", formatDate(intervention.agreementAt));
    row("Montant", intervention.amountCents ? `${(intervention.amountCents / 100).toFixed(2)} EUR` : "-");
  }

  if (intervention.workNotes) {
    doc.moveDown(0.3);
    doc.fontSize(13).font("Helvetica-Bold").text("Travaux effectues", { underline: true });
    doc.moveDown(0.2);
    doc.fontSize(11).font("Helvetica").text(intervention.workNotes, { width: right - left });
  }

  if (intervention.closedAt) {
    doc.moveDown(0.3);
    row("Cloturee le", formatDate(intervention.closedAt));
  }

  if (intervention.documents && intervention.documents.length > 0) {
    doc.moveDown(0.3);
    doc.fontSize(13).font("Helvetica-Bold").text("Documents lies", { underline: true });
    doc.moveDown(0.2);
    intervention.documents.forEach((d: any, idx: number) => {
      const catLabel = d.category || "Divers";
      row(`Doc ${idx + 1}`, `[${catLabel}] ${d.fileName}`);
    });
  }

  doc.end();
  return done;
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

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    requireActiveSubscription(user);

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
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Fetch Yousign signatures for this intervention
    const eSignatures = await prisma.eSignatureRequest.findMany({
      where: {
        interventionId: id,
        status: "DONE",
      },
      select: {
        id: true,
        documentType: true,
        status: true,
        signerEmail: true,
        signerName: true,
        signedAt: true,
        signedDocumentUrl: true,
        signedDocumentKey: true,
        auditTrailUrl: true,
        auditTrailKey: true,
        providerSignatureRequestId: true,
      },
    });

    // Decrypt client data
    const client = decryptClientData(intervention.vehicle.client as Record<string, unknown>) as {
      id: number;
      firstName: string;
      lastName: string;
    };

    // Prepare archive
    const passThrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    passThrough.on("data", (chunk) => chunks.push(chunk));
    archive.pipe(passThrough);

    const hashes: { file: string; sha256: string }[] = [];

    // 1. Generate and add PDF
    const pdfBuffer = await generatePdfBuffer(intervention, client);
    const pdfName = `dossier_${intervention.id}.pdf`;
    archive.append(pdfBuffer, { name: pdfName });
    hashes.push({ file: pdfName, sha256: sha256(pdfBuffer) });

    // 2. Add documents by category
    const categoryFolders: Record<string, string> = {
      ENTREE: "01_entree",
      SORTIE: "02_sortie",
      DIAGNOSTIC: "03_diagnostic",
      PIECES: "04_pieces",
      DIVERS: "05_divers",
    };

    for (const doc of intervention.documents) {
      const buffer = await fetchFileBuffer(doc.fileUrl);
      if (!buffer) continue;

      const folder = categoryFolders[doc.category ?? "DIVERS"] ?? "05_divers";
      const filePath = `${folder}/${doc.fileName}`;
      archive.append(buffer, { name: filePath });
      hashes.push({ file: filePath, sha256: sha256(buffer) });
    }

    // 3. Generate timeline
    const timelineEvents: string[] = [];
    timelineEvents.push(`[${formatDate(intervention.createdAt)}] Création du dossier`);

    if (intervention.agreementAt) {
      timelineEvents.push(`[${formatDate(intervention.agreementAt)}] Accord client validé`);
    }

    for (const doc of intervention.documents) {
      timelineEvents.push(`[${formatDate(doc.createdAt)}] Document ajouté: ${doc.fileName} (${doc.category ?? "DIVERS"})`);
    }

    if (intervention.closedAt) {
      timelineEvents.push(`[${formatDate(intervention.closedAt)}] Clôture de l'intervention`);
    }

    // 4. Add Yousign signatures (signed documents + audit trails)
    const signatureSummary: {
      documentType: string;
      status: string;
      signedAt: string | null;
      signerEmail: string;
      signerName: string;
      providerRequestId: string | null;
      signedDocumentHash?: string;
      auditTrailHash?: string;
    }[] = [];

    for (const sig of eSignatures) {
      const docTypeFolder = sig.documentType === "INTERVENTION_ORDER" ? "OR" : 
                            sig.documentType === "INTERVENTION_DELIVERY" ? "PV" : 
                            sig.documentType.replace(/[^a-zA-Z0-9]/g, "_");
      
      // Add signed document
      if (sig.signedDocumentKey) {
        const signedBuffer = await fetchFileBuffer(`/api/uploads/file/${sig.signedDocumentKey}`);
        if (signedBuffer) {
          const signedPath = `signatures/${docTypeFolder}/document_signe.zip`;
          archive.append(signedBuffer, { name: signedPath });
          const signedHash = sha256(signedBuffer);
          hashes.push({ file: signedPath, sha256: signedHash });
          
          // Add to summary
          const summaryEntry = signatureSummary.find(s => s.documentType === sig.documentType);
          if (summaryEntry) {
            summaryEntry.signedDocumentHash = signedHash;
          }
        }
      }

      // Add audit trail
      if (sig.auditTrailKey) {
        const auditBuffer = await fetchFileBuffer(`/api/uploads/file/${sig.auditTrailKey}`);
        if (auditBuffer) {
          const auditPath = `signatures/${docTypeFolder}/certificat_audit.zip`;
          archive.append(auditBuffer, { name: auditPath });
          const auditHash = sha256(auditBuffer);
          hashes.push({ file: auditPath, sha256: auditHash });
          
          // Add to summary
          const summaryEntry = signatureSummary.find(s => s.documentType === sig.documentType);
          if (summaryEntry) {
            summaryEntry.auditTrailHash = auditHash;
          }
        }
      }

      // Build summary entry
      signatureSummary.push({
        documentType: sig.documentType,
        status: sig.status,
        signedAt: sig.signedAt ? formatDate(sig.signedAt) : null,
        signerEmail: sig.signerEmail,
        signerName: sig.signerName,
        providerRequestId: sig.providerSignatureRequestId,
      });

      // Add to timeline
      if (sig.signedAt) {
        timelineEvents.push(`[${formatDate(sig.signedAt)}] Signature électronique: ${sig.documentType} signé par ${sig.signerName}`);
      }
    }

    // Add signature summary JSON
    if (signatureSummary.length > 0) {
      const summaryJson = JSON.stringify(signatureSummary, null, 2);
      const summaryBuffer = Buffer.from(summaryJson, "utf-8");
      archive.append(summaryBuffer, { name: "signatures/summary.json" });
      hashes.push({ file: "signatures/summary.json", sha256: sha256(summaryBuffer) });
    }

    const timelineContent = `TIMELINE - Intervention ${intervention.id}\n${"=".repeat(50)}\n\n${timelineEvents.join("\n")}\n`;
    const timelineBuffer = Buffer.from(timelineContent, "utf-8");
    archive.append(timelineBuffer, { name: "timeline.txt" });
    hashes.push({ file: "timeline.txt", sha256: sha256(timelineBuffer) });

    // 4. Generate hashes file
    const hashesContent = `HASHES SHA-256 - Intervention ${intervention.id}\n${"=".repeat(50)}\nGenere le: ${formatDate(new Date())}\n\n${hashes.map((h) => `${h.sha256}  ${h.file}`).join("\n")}\n`;
    archive.append(Buffer.from(hashesContent, "utf-8"), { name: "hashes.txt" });

    // Finalize
    await archive.finalize();

    // Wait for all data
    await new Promise<void>((resolve) => passThrough.on("end", resolve));

    const zipBuffer = Buffer.concat(chunks);
    const plate = intervention.vehicle.plate.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `dossier_${plate}_${intervention.id.slice(0, 8)}.zip`;

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
