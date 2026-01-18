/**
 * Insurance Info PDF Generator
 * Generates "Attestation d'intervention / Informations à transmettre à l'assurance"
 * For interventions with modifications requiring insurance declaration
 */

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { prisma } from "@/lib/prisma";
import { decryptClientData } from "@/lib/encryption";
import { createHash } from "crypto";
import { INTERVENTION_TAGS } from "@/lib/legal/tags";
import { isPartnerBadgeActive, loadPartnerBadgeSvg } from "@/lib/pdf/partnerBadge";

// Types
export interface InsuranceInfoResult {
  pdfBuffer: Buffer;
  sha256: string;
  filename: string;
}

// Helpers
function asText(value: unknown, fallback = "Non renseigné") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Non renseigné";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Non renseigné";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Determine the modification type based on intervention tags
 */
function getModificationType(tags: string[]): {
  type: "E85_BOITIER" | "E85_CARTO" | "REPROG" | "OTHER_MODIF" | "NONE";
  label: string;
  description: string;
} {
  if (tags.includes("E85_BOITIER")) {
    return {
      type: "E85_BOITIER",
      label: "Installation boîtier éthanol E85",
      description: "Installation d'un boîtier de conversion éthanol E85 homologué, permettant au véhicule de fonctionner au Superéthanol-E85. Le boîtier adapte automatiquement l'injection en fonction du carburant utilisé.",
    };
  }
  if (tags.includes("E85_CARTO")) {
    return {
      type: "E85_CARTO",
      label: "Reprogrammation E85 (cartographie)",
      description: "Modification de la cartographie moteur pour une compatibilité avec le Superéthanol-E85. Cette modification agit directement sur le calculateur moteur.",
    };
  }
  if (tags.includes("REPROG_PERF") || tags.includes("REPROG_ECU")) {
    const stage = tags.includes("REPROG_PERF") ? "performance" : "ECU";
    return {
      type: "REPROG",
      label: `Reprogrammation moteur (${stage})`,
      description: "Optimisation de la cartographie moteur (calculateur). Cette intervention peut modifier les caractéristiques techniques d'origine du véhicule (puissance, couple).",
    };
  }
  if (tags.includes("OTHER_MODIF")) {
    return {
      type: "OTHER_MODIF",
      label: "Modification technique",
      description: "Modification technique sur le véhicule pouvant affecter ses caractéristiques d'origine.",
    };
  }
  return {
    type: "NONE",
    label: "Intervention standard",
    description: "Cette intervention ne nécessite pas de déclaration particulière à l'assurance.",
  };
}

/**
 * Check if intervention requires insurance declaration
 */
export function requiresInsuranceDeclaration(tags: string[]): boolean {
  return tags.some((tag) => {
    const tagInfo = INTERVENTION_TAGS.find((t) => t.value === tag);
    return tagInfo?.requiresInsuranceDeclaration === true;
  });
}

/**
 * Build the Insurance Info PDF for an intervention
 * @param interventionId - The intervention ID
 * @returns PDF buffer, hash, and filename
 */
export async function buildInsuranceInfoPdf(interventionId: string): Promise<InsuranceInfoResult> {
  // 1. Fetch intervention with all related data
  const intervention = await prisma.intervention.findUnique({
    where: { id: interventionId },
    include: {
      vehicle: { include: { client: true } },
      garage: true,
    },
  });

  if (!intervention) {
    throw new Error(`Intervention ${interventionId} not found`);
  }

  // 2. Decrypt client data
  const clientRaw = intervention.vehicle.client as Record<string, unknown>;
  const client = decryptClientData(clientRaw) as {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  const garage = intervention.garage;
  const vehicle = intervention.vehicle;
  const tags = (intervention.tags as string[]) ?? [];

  // 3. Get modification type
  const modType = getModificationType(tags);

  // 4. Create PDF document
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

  // Helper functions
  const row = (label: string, value: string) => {
    const labelWidth = 160;
    const valueWidth = contentWidth - labelWidth;
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).text(label, left, y, { width: labelWidth });
    doc.font("Helvetica").fontSize(10).text(value, left + labelWidth, y, { width: valueWidth });
    doc.moveDown(0.4);
  };

  const section = (title: string) => {
    doc.moveDown(0.6);
    doc.fontSize(12).font("Helvetica-Bold").text(title);
    doc.moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).strokeColor("#444").lineWidth(0.5).stroke();
    doc.moveDown(0.4);
  };

  // === HEADER with garage branding ===
  let hasLogo = false;
  if (garage?.logoKey) {
    try {
      const logoPath = require("path").join(process.cwd(), "uploads", garage.logoKey);
      const fs = require("fs");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        doc.image(logoBuffer, left, doc.y, { width: 80, height: 40, fit: [80, 40] });
        hasLogo = true;
      }
    } catch (logoErr) {
      console.warn("Failed to load garage logo:", logoErr);
    }
  }

  // Garage name/info in header
  const headerY = doc.y;
  const garageName = garage?.displayName || garage?.name || "MotorSafe";

  if (hasLogo) {
    doc.fontSize(14).font("Helvetica-Bold").text(garageName, left + 90, headerY, { width: contentWidth - 100 });
    const addrParts = [
      garage?.addressLine1,
      garage?.addressLine2,
      [garage?.postalCode, garage?.city].filter(Boolean).join(" "),
    ].filter(Boolean);
    if (addrParts.length > 0 || garage?.phone || garage?.email) {
      doc.fontSize(8).font("Helvetica").fillColor("#666");
      if (addrParts.length > 0) {
        doc.text(addrParts.join(" — "), left + 90, doc.y, { width: contentWidth - 100 });
      }
      const contactParts = [garage?.phone, garage?.email].filter(Boolean);
      if (contactParts.length > 0) {
        doc.text(contactParts.join(" • "), left + 90, doc.y, { width: contentWidth - 100 });
      }
      doc.fillColor("#000");
    }
    doc.y = Math.max(doc.y, headerY + 45);
  } else {
    doc.fontSize(14).font("Helvetica-Bold").text(garageName, left, doc.y, { align: "center", width: contentWidth });
    const addrParts = [
      garage?.addressLine1,
      [garage?.postalCode, garage?.city].filter(Boolean).join(" "),
    ].filter(Boolean);
    if (addrParts.length > 0) {
      doc.fontSize(8).font("Helvetica").fillColor("#666").text(addrParts.join(" — "), { align: "center", width: contentWidth });
      doc.fillColor("#000");
    }
  }

  doc.moveDown(0.5);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ccc").lineWidth(0.5).stroke();
  doc.moveDown(0.5);

  // Partner badge (top right corner)
  if (isPartnerBadgeActive(garage)) {
    const badgeBuffer = loadPartnerBadgeSvg();
    if (badgeBuffer) {
      try {
        doc.image(badgeBuffer, right - 60, 12, { width: 55 });
      } catch (e) {
        console.warn("Failed to render partner badge:", e);
      }
    }
  }

  // === DOCUMENT TITLE ===
  doc.fontSize(16).font("Helvetica-Bold").text("ATTESTATION D'INTERVENTION", left, doc.y, { align: "center" });
  doc.moveDown(0.2);
  doc.fontSize(11).font("Helvetica").fillColor("#666").text("Information à transmettre à votre assurance", { align: "center" });
  doc.fillColor("#000");
  doc.moveDown(1);

  // === SECTION 1: DOSSIER ===
  section("1. Identification du dossier");
  row("N° Intervention", intervention.id.slice(0, 8).toUpperCase());
  row("Date intervention", formatDate(intervention.performedAt ?? intervention.createdAt));
  row("Client", `${client.firstName} ${client.lastName}`);
  doc.moveDown(0.2);

  // === SECTION 2: VÉHICULE ===
  section("2. Véhicule concerné");
  row("Immatriculation", asText(vehicle.plate));
  row("Marque / Modèle", `${asText(vehicle.brand)} ${asText(vehicle.model)}`);
  if (vehicle.vin) row("VIN", asText(vehicle.vin));
  if (vehicle.year) row("Année", String(vehicle.year));

  // Technical data from vehicle if available
  const vehRaw = vehicle as Record<string, unknown>;
  if (vehRaw.powerCv) row("Puissance", `${vehRaw.powerCv} cv`);
  if (vehRaw.engineCc) row("Cylindrée", `${vehRaw.engineCc} cm³`);
  if (vehRaw.fuelType) row("Énergie", String(vehRaw.fuelType));

  doc.moveDown(0.2);

  // === SECTION 3: NATURE DE L'INTERVENTION ===
  section("3. Nature de l'intervention");
  doc.font("Helvetica-Bold").fontSize(11).text(modType.label, left, doc.y);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10).text(modType.description, left, doc.y, { width: contentWidth, align: "justify" });
  doc.moveDown(0.5);

  // Add notes if available
  if (intervention.notes || intervention.workNotes) {
    doc.font("Helvetica-Oblique").fontSize(9).fillColor("#555");
    doc.text("Détails complémentaires :", left, doc.y);
    doc.font("Helvetica").text(asText(intervention.workNotes || intervention.notes, "Aucun"), left, doc.y, { width: contentWidth });
    doc.fillColor("#000");
  }

  doc.moveDown(0.5);

  // === SECTION 4: INFORMATION ASSURANCE ===
  section("4. Information à l'attention du client");

  // Warning box
  const boxY = doc.y;
  doc.save();
  doc.roundedRect(left, boxY, contentWidth, 90, 4).fillAndStroke("#FEF3C7", "#F59E0B");
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#92400E");
  doc.text("⚠ OBLIGATION D'INFORMATION ASSURANCE", left + 10, boxY + 10, { width: contentWidth - 20 });
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9).fillColor("#78350F");
  doc.text(
    "Selon l'article L113-2 du Code des assurances, vous avez l'obligation de déclarer à votre assureur toute modification notable de votre véhicule susceptible d'aggraver le risque assuré.",
    left + 10,
    doc.y,
    { width: contentWidth - 20, align: "justify" }
  );
  doc.moveDown(0.3);
  doc.text(
    "Nous vous invitons à contacter votre compagnie d'assurance pour vérifier si cette intervention nécessite une déclaration et/ou une adaptation de votre contrat.",
    left + 10,
    doc.y,
    { width: contentWidth - 20, align: "justify" }
  );
  doc.fillColor("#000");
  doc.y = boxY + 95;

  doc.moveDown(0.5);

  // Disclaimer
  doc.font("Helvetica-Oblique").fontSize(8).fillColor("#666");
  doc.text(
    "Ce document est fourni à titre informatif. Il ne constitue pas une homologation, une garantie de conformité réglementaire, ni un conseil juridique. Le professionnel décline toute responsabilité en cas de défaut de déclaration par le client.",
    left,
    doc.y,
    { width: contentWidth, align: "justify" }
  );
  doc.fillColor("#000");

  doc.moveDown(1);

  // === FOOTER ===
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ccc").lineWidth(0.5).stroke();
  doc.moveDown(0.5);

  doc.font("Helvetica").fontSize(9);
  const footerY = doc.y;
  doc.text(`Document généré le ${formatDate(new Date())}`, left, footerY);
  doc.text(garageName, left, footerY, { align: "right", width: contentWidth });

  // SIREN if available
  if (garage?.siret) {
    doc.moveDown(0.2);
    doc.fontSize(8).fillColor("#888").text(`SIRET: ${garage.siret}`, { align: "right" });
  }

  // SafeMotor branding footer
  doc.moveDown(0.5);
  doc.fontSize(7).fillColor("#999").text(
    "Généré avec SafeMotor — motorsafe.fr",
    left, doc.y, { align: "center", width: contentWidth }
  );
  doc.fillColor("#000");

  // End document
  doc.end();

  const pdfBuffer = await done;
  const sha256 = createHash("sha256").update(pdfBuffer).digest("hex");
  const plate = vehicle.plate.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `attestation_assurance_${plate}_${intervention.id.slice(0, 8)}.pdf`;

  return { pdfBuffer, sha256, filename };
}
