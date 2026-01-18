/**
 * INSURANCE-INCIDENT-01: Incident Summary PDF
 * GET /api/interventions/[id]/incident/summary.pdf
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { buildPdfBrandingContext, renderPdfHeader, renderPdfFooter } from "@/lib/pdf/branding";
import { getEvidenceChain } from "@/lib/legal/evidenceChain";
import { decryptClientData } from "@/lib/encryption";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

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

const typeLabels: Record<string, string> = {
  ENGINE: "Moteur", GEARBOX: "Boîte de vitesses", ELECTRICAL: "Électrique",
  TUNING_ISSUE: "Problème modification", ACCIDENT: "Accident", WARRANTY: "Garantie",
  CUSTOMER_COMPLAINT: "Réclamation client", OTHER: "Autre",
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id } = await context.params;
    if (!id) throw new RouteError(400, "BAD_REQUEST", "ID intervention requis");
    if (user.role === "ADMIN" || !user.garageId) {
      throw new RouteError(403, "FORBIDDEN", "Action réservée aux garages");
    }

    await requireFeature(user.garageId, FeatureKey.INSURANCE_DOC);

    const intervention = await prisma.intervention.findFirst({
      where: { id, garageId: user.garageId, deletedAt: null },
      include: {
        incidentCase: true,
        vehicle: { include: { client: true } },
        garage: true,
      },
    });

    if (!intervention) throw new RouteError(404, "NOT_FOUND", "Intervention introuvable");
    if (!intervention.incidentCase) {
      throw new RouteError(404, "NOT_FOUND", "Pas de dossier incident");
    }

    const ic = intervention.incidentCase;
    const client = decryptClientData(intervention.vehicle.client as Record<string, unknown>) as {
      firstName?: string; lastName?: string; phone?: string; email?: string;
    };

    const evidenceChain = await getEvidenceChain({
      garageId: user.garageId,
      entityType: "intervention",
      entityId: id,
    });

    // Build PDF
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
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(10).text(label, left, y, { width: 150 });
      doc.font("Helvetica").fontSize(10).text(value, left + 150, y, { width: right - left - 150 });
      doc.moveDown(0.3);
    };

    const section = (title: string) => {
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica-Bold").text(title, { underline: true });
      doc.moveDown(0.3);
    };

    const paragraph = (text: string | null | undefined) => {
      if (!text) return;
      doc.font("Helvetica").fontSize(10).text(text, { width: right - left });
      doc.moveDown(0.3);
    };

    // Branded header
    const brandingCtx = await buildPdfBrandingContext(user.garageId);
    if (brandingCtx) {
      const contentY = renderPdfHeader(doc, brandingCtx, {
        title: "DOSSIER INCIDENT / ASSURANCE",
        documentNumber: `Réf: ${ic.id.slice(0, 8).toUpperCase()}`,
        date: formatDate(new Date()),
      });
      doc.y = contentY;
      renderPdfFooter(doc, brandingCtx);
    } else {
      doc.fontSize(16).font("Helvetica-Bold").text("DOSSIER INCIDENT / ASSURANCE", left);
      doc.fontSize(10).font("Helvetica").text(`Généré le: ${formatDate(new Date())}`, { align: "right" });
      doc.moveTo(left, doc.y + 4).lineTo(right, doc.y + 4).strokeColor("#444").stroke();
      doc.moveDown(1);
    }

    // Status banner
    const statusColors: Record<string, string> = { DRAFT: "#FFA500", OPEN: "#3B82F6", CLOSED: "#10B981" };
    doc.rect(left, doc.y, right - left, 25).fill(statusColors[ic.status] || "#888");
    doc.fillColor("#FFFFFF").fontSize(12).font("Helvetica-Bold")
      .text(`Statut: ${ic.status}`, left + 10, doc.y - 20, { width: right - left - 20 });
    doc.fillColor("#000000");
    doc.moveDown(1.5);

    section("Informations du dossier");
    row("Référence", ic.id);
    row("Type d'incident", typeLabels[ic.incidentType || "OTHER"] || "-");
    row("Créé le", formatDate(ic.createdAt));
    row("Ouvert le", formatDate(ic.openedAt));
    row("Fermé le", formatDate(ic.closedAt));
    row("Pièces jointes", `${ic.attachmentKeys.length} document(s)`);

    section("Intervention liée");
    row("ID", intervention.id);
    row("Type", intervention.type);
    row("Date", formatDate(intervention.performedAt));
    row("Statut", intervention.status);

    section("Véhicule");
    row("Immatriculation", intervention.vehicle.plate);
    row("Marque / Modèle", `${intervention.vehicle.brand} ${intervention.vehicle.model}`);
    row("VIN", asText(intervention.vehicle.vin));
    row("Kilométrage", intervention.odometerKm ? `${intervention.odometerKm} km` : "-");

    section("Client");
    row("Nom", `${client.firstName || ""} ${client.lastName || ""}`.trim() || "-");
    row("Téléphone", asText(client.phone));
    row("Email", asText(client.email));

    if (doc.y > 650) doc.addPage();
    section("Description de l'incident");
    paragraph(ic.description);

    section("Circonstances");
    paragraph(ic.circumstances);

    section("Dégâts constatés");
    paragraph(ic.damagesObserved);

    if (doc.y > 500) doc.addPage();
    section("Déclaration du client");
    paragraph(ic.customerStatement);
    if (ic.customerSignatureId) {
      doc.font("Helvetica-Oblique").fontSize(9).fillColor("#10B981").text("✓ Signé électroniquement");
      doc.fillColor("#000000");
      doc.moveDown(0.3);
    }

    section("Déclaration du garage");
    paragraph(ic.garageStatement);
    if (ic.garageSignatureId) {
      doc.font("Helvetica-Oblique").fontSize(9).fillColor("#10B981").text("✓ Signé électroniquement");
      doc.fillColor("#000000");
      doc.moveDown(0.3);
    }

    // Evidence timeline
    if (evidenceChain.length > 0) {
      doc.addPage();
      section("Chronologie des événements");
      doc.fontSize(8).font("Helvetica");
      for (const entry of evidenceChain.slice(0, 30)) {
        const dateStr = entry.createdAt ? formatDate(new Date(entry.createdAt)) : "-";
        doc.text(`• ${dateStr} - ${entry.eventType || "ACTION"}`);
        doc.moveDown(0.15);
        if (doc.y > 750) doc.addPage();
      }
      if (evidenceChain.length > 30) {
        doc.font("Helvetica-Oblique").text(`... et ${evidenceChain.length - 30} autres événements`);
      }
    }

    // Garage info
    if (intervention.garage) {
      doc.addPage();
      section("Établissement");
      row("Garage", intervention.garage.displayName || intervention.garage.name);
      row("SIRET", asText((intervention.garage as { siret?: string }).siret));
      row("Adresse", asText((intervention.garage as { address?: string }).address));
    }

    doc.moveDown(1);
    doc.fontSize(8).font("Helvetica-Oblique").fillColor("#666")
      .text("Document généré par MotorSafe - Chaîne de preuves garantie.", { align: "center" });

    doc.end();
    const buffer = await done;
    const hash = createHash("sha256").update(buffer).digest("hex");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="incident-${ic.id.slice(0, 8)}.pdf"`,
        "X-PDF-Hash": hash,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
