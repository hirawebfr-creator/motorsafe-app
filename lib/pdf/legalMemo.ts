/**
 * Legal Memo PDF Generator
 * Generates a 1-page summary document for legal/insurance purposes
 * Contains: signature status, signed clauses, hashes, timeline
 */

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { prisma } from "@/lib/prisma";
import { decryptClientData } from "@/lib/encryption";
import { createHash } from "crypto";
import { isPartnerBadgeActive, loadPartnerBadgeSvg } from "@/lib/pdf/partnerBadge";

export interface LegalMemoResult {
  pdfBuffer: Buffer;
  sha256: string;
  filename: string;
}

interface ParsedClause {
  id: string;
  title: string;
  text?: string;
}

// Helpers
function asText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return "-";
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  const masked = local.length > 2 ? `${local.slice(0, 2)}***` : "***";
  return `${masked}@${domain}`;
}

function truncateHash(hash: string | null | undefined, len = 16): string {
  if (!hash) return "-";
  return hash.length > len ? `${hash.slice(0, len)}...` : hash;
}

/**
 * Build Legal Memo PDF for an intervention
 */
export async function buildLegalMemoPdf(interventionId: string): Promise<LegalMemoResult> {
  // 1. Fetch intervention with all related data
  const intervention = await prisma.intervention.findUnique({
    where: { id: interventionId },
    include: {
      vehicle: { include: { client: true } },
      garage: true,
      documents: { where: { deletedAt: null } },
    },
  });

  if (!intervention) {
    throw new Error(`Intervention ${interventionId} not found`);
  }

  // Decrypt client
  const client = decryptClientData(intervention.vehicle.client as Record<string, unknown>) as {
    firstName: string;
    lastName: string;
    email?: string | null;
  };

  // 2. Get latest signature request
  const signatureRequest = await prisma.signatureRequest.findFirst({
    where: { documentId: interventionId },
    orderBy: [{ revision: "desc" }, { createdAt: "desc" }],
    include: { events: { orderBy: { at: "asc" } } },
  });

  const isSigned = signatureRequest?.status === "SIGNED";
  const signedEvent = signatureRequest?.events.find((e) => e.type === "SIGNED");
  const viewedEvent = signatureRequest?.events.find((e) => e.type === "VIEWED");
  const sentEvent = signatureRequest?.events.find((e) => e.type === "SENT");

  // Parse legal snapshot if available
  let signedClauses: ParsedClause[] = [];
  if (signatureRequest?.legalSnapshotJson) {
    try {
      const snapshot = JSON.parse(signatureRequest.legalSnapshotJson);
      if (snapshot.clauses && Array.isArray(snapshot.clauses)) {
        signedClauses = snapshot.clauses.map((c: { id?: string; title?: string; text?: string }) => ({
          id: c.id || "?",
          title: c.title || "Clause",
          text: c.text,
        }));
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  // 3. Build PDF
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
  const contentWidth = right - left;

  // === HEADER ===
  doc.fontSize(18).font("Helvetica-Bold").text("MÉMO JURIDIQUE", left, doc.y, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#666").text("Document de synthèse à valeur probatoire", { align: "center" });
  doc.fillColor("#000");
  doc.moveDown(0.5);

  // Garage info
  const garageName = intervention.garage?.displayName || intervention.garage?.name || "Garage";
  doc.fontSize(11).font("Helvetica-Bold").text(garageName, { align: "center" });
  doc.moveDown(0.8);

  // Separator
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ccc").stroke();
  doc.moveDown(0.5);

  // Partner badge (top right corner)
  if (isPartnerBadgeActive(intervention.garage)) {
    const badgeBuffer = loadPartnerBadgeSvg();
    if (badgeBuffer) {
      try {
        doc.image(badgeBuffer, right - 60, 12, { width: 55 });
      } catch (e) {
        console.warn("Failed to render partner badge:", e);
      }
    }
  }

  // === SECTION: DOSSIER ===
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a2e").text("1. DOSSIER D'INTERVENTION");
  doc.fillColor("#000");
  doc.moveDown(0.3);

  const rowY = () => doc.y;
  const drawRow = (label: string, value: string) => {
    doc.fontSize(9).font("Helvetica-Bold").text(label, left, rowY(), { continued: true, width: 140 });
    doc.font("Helvetica").text(`: ${value}`, { width: contentWidth - 140 });
  };

  drawRow("N° Intervention", interventionId.slice(-12).toUpperCase());
  drawRow("Date création", formatDate(intervention.createdAt));
  drawRow("Statut", intervention.status);
  if (intervention.closedAt) {
    drawRow("Clôturée le", formatDate(intervention.closedAt));
  }
  doc.moveDown(0.3);
  drawRow("Client", `${client.firstName} ${client.lastName}`);
  drawRow("Véhicule", `${intervention.vehicle.plate} — ${intervention.vehicle.brand} ${intervention.vehicle.model}`);
  if (intervention.vehicle.vin) {
    drawRow("VIN", asText(intervention.vehicle.vin));
  }
  doc.moveDown(0.5);

  // === SECTION: SIGNATURE ===
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a2e").text("2. STATUT DE SIGNATURE");
  doc.fillColor("#000");
  doc.moveDown(0.3);

  if (isSigned) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#22c55e").text("✓ DOCUMENT SIGNÉ", left);
    doc.fillColor("#000");
  } else {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#ef4444").text("✗ NON SIGNÉ", left);
    doc.fillColor("#000");
    if (signatureRequest) {
      doc.fontSize(9).font("Helvetica").text(`Statut actuel: ${signatureRequest.status}`);
    }
  }
  doc.moveDown(0.3);

  if (signatureRequest) {
    drawRow("Envoyé le", formatDateTime(signatureRequest.sentAt || sentEvent?.at));
    drawRow("Consulté le", formatDateTime(signatureRequest.lastViewedAt || viewedEvent?.at));
    drawRow("Signé le", formatDateTime(signatureRequest.signedAt || signedEvent?.at));
    drawRow("Signataire", asText(signatureRequest.signerNameDeclared));
    drawRow("Email (masqué)", maskEmail(signatureRequest.signerEmail));
    doc.moveDown(0.3);
    drawRow("Hash PDF signé", truncateHash(signatureRequest.signedPdfHash, 24));
    drawRow("Hash snapshot légal", truncateHash(signatureRequest.legalSnapshotHash, 24));
  } else {
    doc.fontSize(9).font("Helvetica").text("Aucune demande de signature trouvée pour ce dossier.");
  }
  doc.moveDown(0.5);

  // === SECTION: CLAUSES SIGNÉES ===
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a2e").text("3. CLAUSES SIGNÉES");
  doc.fillColor("#000");
  doc.moveDown(0.3);

  if (signedClauses.length > 0) {
    doc.fontSize(9).font("Helvetica").text(`${signedClauses.length} clause(s) incluse(s) dans le snapshot signé:`);
    doc.moveDown(0.2);

    for (const clause of signedClauses) {
      // Bullet point
      doc.fontSize(9).font("Helvetica-Bold").text(`• ${clause.id}`, left + 10, doc.y, { continued: true });
      doc.font("Helvetica").text(` — ${clause.title}`);
    }
    doc.moveDown(0.2);
    doc.fontSize(8).font("Helvetica").fillColor("#666").text("Texte intégral disponible dans le PDF signé et le snapshot JSON.");
    doc.fillColor("#000");
  } else {
    doc.fontSize(9).font("Helvetica").fillColor("#666");
    if (isSigned) {
      doc.text("Snapshot légal absent ou non parsable. Vérifier legalSnapshotJson.");
    } else {
      doc.text("Document non signé — les clauses seront fixées à la signature.");
    }
    doc.fillColor("#000");
  }
  doc.moveDown(0.5);

  // === SECTION: PIÈCES JOINTES ===
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a2e").text("4. PIÈCES JOINTES");
  doc.fillColor("#000");
  doc.moveDown(0.3);

  const docs = intervention.documents;
  if (docs.length > 0) {
    // Count by type
    const pdfCount = docs.filter((d) => d.fileName.toLowerCase().endsWith(".pdf")).length;
    const imgCount = docs.filter((d) => /\.(jpg|jpeg|png|gif|webp)$/i.test(d.fileName)).length;
    const otherCount = docs.length - pdfCount - imgCount;

    doc.fontSize(9).font("Helvetica").text(`${docs.length} pièce(s) jointe(s) au dossier:`);
    doc.moveDown(0.2);
    if (pdfCount > 0) doc.text(`  • ${pdfCount} document(s) PDF`);
    if (imgCount > 0) doc.text(`  • ${imgCount} image(s)`);
    if (otherCount > 0) doc.text(`  • ${otherCount} autre(s) fichier(s)`);
  } else {
    doc.fontSize(9).font("Helvetica").fillColor("#666").text("Aucune pièce jointe.");
    doc.fillColor("#000");
  }
  doc.moveDown(0.8);

  // === FOOTER ===
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ccc").stroke();
  doc.moveDown(0.3);

  doc.fontSize(8).font("Helvetica").fillColor("#888");
  doc.text(`Généré le ${formatDateTime(new Date())}`, left);
  doc.moveDown(0.2);
  doc.text("Ce document constitue une synthèse du dossier. Les hashes SHA-256 garantissent l'intégrité des fichiers.");
  doc.text("Toute modification des documents originaux invalide les hashes de vérification.");
  doc.fillColor("#000");

  doc.end();

  const pdfBuffer = await done;
  const pdfHash = createHash("sha256").update(pdfBuffer).digest("hex");
  const filename = `memo_juridique_${interventionId.slice(-8)}.pdf`;

  return { pdfBuffer, sha256: pdfHash, filename };
}
