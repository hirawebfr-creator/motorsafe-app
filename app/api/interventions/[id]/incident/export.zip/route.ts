/**
 * INSURANCE-INCIDENT-01: Insurance-Ready Export ZIP
 * GET /api/interventions/[id]/incident/export.zip
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { getEvidenceChain } from "@/lib/legal/evidenceChain";
import { decryptClientData } from "@/lib/encryption";
import { Buffer } from "buffer";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { PassThrough } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function formatDate(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

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
    const abs = path.join(process.cwd(), "uploads", fileUrl);
    return await readFile(abs);
  } catch {
    return null;
  }
}

interface AuditFile { path: string; sha256: string; sizeBytes: number; }

interface IncidentAuditJson {
  exportVersion: string;
  generatedAt: string;
  incidentCaseId: string;
  interventionId: string;
  garageId: number;
  status: string;
  incidentType: string | null;
  openedAt: string | null;
  closedAt: string | null;
  hasCustomerSignature: boolean;
  hasGarageSignature: boolean;
  attachmentCount: number;
  evidenceEntryCount: number;
  files: AuditFile[];
  errors: string[];
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await context.params;
    if (!id) throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    // INCIDENT_REPORT = PRO only for export
    await requireFeature(user.garageId, FeatureKey.INCIDENT_REPORT);

    const intervention = await prisma.intervention.findFirst({
      where: { id, garageId: user.garageId, deletedAt: null },
      include: {
        incidentCase: true,
        vehicle: { include: { client: true } },
        garage: true,
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    if (!intervention.incidentCase) {
      throw new RouteError(404, "NOT_FOUND", "Pas de dossier incident");
    }

    const ic = intervention.incidentCase;
    if (ic.status === "DRAFT") {
      throw new RouteError(400, "BAD_REQUEST", "Ouvrir le dossier avant export");
    }

    const client = decryptClientData(intervention.vehicle.client as Record<string, unknown>) as {
      firstName?: string; lastName?: string;
    };

    const evidenceChain = await getEvidenceChain({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
    });

    // Prepare archive
    const passThrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    passThrough.on("data", (chunk) => chunks.push(chunk));
    archive.pipe(passThrough);

    const files: AuditFile[] = [];
    const errors: string[] = [];

    // 01_dossier/ - Summary PDF
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const summaryRes = await fetch(`${baseUrl}/api/interventions/${id}/incident/summary.pdf`, {
        headers: { Cookie: req.headers.get("cookie") || "" },
      });
      if (summaryRes.ok) {
        const buffer = Buffer.from(await summaryRes.arrayBuffer());
        const filePath = "01_dossier/01_resume_incident.pdf";
        archive.append(buffer, { name: filePath });
        files.push({ path: filePath, sha256: sha256(buffer), sizeBytes: buffer.length });
      } else {
        errors.push("Échec génération PDF résumé");
      }
    } catch (err) {
      errors.push(`PDF résumé: ${err instanceof Error ? err.message : "erreur"}`);
    }

    // 02_pieces_jointes/
    for (let i = 0; i < ic.attachmentKeys.length; i++) {
      const key = ic.attachmentKeys[i];
      try {
        const buffer = await fetchFileBuffer(key);
        if (buffer) {
          const ext = path.extname(key) || ".bin";
          const fileName = `piece_${String(i + 1).padStart(2, "0")}${ext}`;
          const filePath = `02_pieces_jointes/${fileName}`;
          archive.append(buffer, { name: filePath });
          files.push({ path: filePath, sha256: sha256(buffer), sizeBytes: buffer.length });
        } else {
          errors.push(`Pièce jointe introuvable: ${key}`);
        }
      } catch {
        errors.push(`Erreur pièce ${key}`);
      }
    }

    // 03_intervention/
    for (const doc of intervention.documents) {
      if (doc.fileUrl) {
        try {
          const buffer = await fetchFileBuffer(doc.fileUrl);
          if (buffer) {
            const ext = path.extname(doc.fileUrl) || ".bin";
            const fileName = `doc_${doc.id.slice(0, 8)}${ext}`;
            const filePath = `03_intervention/${fileName}`;
            archive.append(buffer, { name: filePath });
            files.push({ path: filePath, sha256: sha256(buffer), sizeBytes: buffer.length });
          }
        } catch {
          errors.push(`Document ${doc.id}`);
        }
      }
    }

    // 04_preuves/
    const evidenceBuffer = Buffer.from(JSON.stringify(evidenceChain, null, 2), "utf-8");
    const evidencePath = "04_preuves/chaine_preuves.json";
    archive.append(evidenceBuffer, { name: evidencePath });
    files.push({ path: evidencePath, sha256: sha256(evidenceBuffer), sizeBytes: evidenceBuffer.length });

    const timelineLines = [
      "CHRONOLOGIE DES ÉVÉNEMENTS",
      "=".repeat(60),
      `Incident: ${ic.id}`,
      `Intervention: ${id}`,
      `Généré le: ${new Date().toISOString()}`,
      "",
      ...evidenceChain.map((e, i) => 
        `${String(i + 1).padStart(3, " ")}. [${e.createdAt?.toISOString() || "-"}] ${e.eventType || "ACTION"}`
      ),
      "",
    ];
    const timelineBuffer = Buffer.from(timelineLines.join("\n"), "utf-8");
    const timelinePath = "04_preuves/chronologie.txt";
    archive.append(timelineBuffer, { name: timelinePath });
    files.push({ path: timelinePath, sha256: sha256(timelineBuffer), sizeBytes: timelineBuffer.length });

    // 05_signatures/
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: { documentId: id, garageId: user.garageId },
      include: { events: { orderBy: { at: "asc" } } },
    });
    for (const sig of signatureRequests) {
      if (sig.signedPdfKey) {
        try {
          const buffer = await fetchFileBuffer(`/api/uploads/file/${sig.signedPdfKey}`);
          if (buffer) {
            const filePath = `05_signatures/${sig.documentType}_signe_${sig.id.slice(0, 8)}.pdf`;
            archive.append(buffer, { name: filePath });
            files.push({ path: filePath, sha256: sig.signedPdfHash || sha256(buffer), sizeBytes: buffer.length });
          }
        } catch {
          errors.push(`Signature PDF ${sig.id}`);
        }
      }
    }

    // audit.json
    const auditJson: IncidentAuditJson = {
      exportVersion: "1.0.0-incident",
      generatedAt: new Date().toISOString(),
      incidentCaseId: ic.id,
      interventionId: id,
      garageId: user.garageId,
      status: ic.status,
      incidentType: ic.incidentType,
      openedAt: formatDate(ic.openedAt),
      closedAt: formatDate(ic.closedAt),
      hasCustomerSignature: !!ic.customerSignatureId,
      hasGarageSignature: !!ic.garageSignatureId,
      attachmentCount: ic.attachmentKeys.length,
      evidenceEntryCount: evidenceChain.length,
      files: files.map(f => ({ ...f })),
      errors,
    };
    const auditBuffer = Buffer.from(JSON.stringify(auditJson, null, 2), "utf-8");
    archive.append(auditBuffer, { name: "audit.json" });

    // hashes.txt
    const hashesContent = [
      "HASHES SHA-256 - Dossier Incident/Assurance",
      "=".repeat(60),
      `Incident: ${ic.id}`,
      `Intervention: ${id}`,
      `Généré le: ${new Date().toISOString()}`,
      "",
      ...files.map(f => `${f.sha256}  ${f.path}`),
      "",
    ].join("\n");
    archive.append(Buffer.from(hashesContent, "utf-8"), { name: "hashes.txt" });

    await archive.finalize();
    await new Promise<void>((resolve) => passThrough.on("end", resolve));

    const zipBuffer = Buffer.concat(chunks);
    const plate = intervention.vehicle.plate.replace(/[^a-zA-Z0-9]/g, "_");
    const clientName = `${client.firstName || ""}_${client.lastName || ""}`.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const filename = `dossier-incident-${plate}-${clientName}-${ic.id.slice(0, 8)}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Export-Hash": sha256(zipBuffer),
      },
    });
  } catch (err) {
    console.error("Incident export error:", err);
    return toErrorResponse(err);
  }
}
