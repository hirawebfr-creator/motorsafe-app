import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { requireActiveSubscription, requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { decryptClientData } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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

function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "Non renseigné";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Non renseigné";
  return d.toLocaleString("fr-FR");
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
        garage: true,
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Décrypter les données client
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
    const intv = intervention as any;

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

    const row = (label: string, value: string, bold = false) => {
      const labelWidth = 160;
      const valueWidth = contentWidth - labelWidth;
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(10).text(label, left, y, { width: labelWidth });
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).text(value, left + labelWidth, y, { width: valueWidth });
      doc.moveDown(0.4);
    };

    const section = (title: string) => {
      doc.moveDown(0.6);
      doc.fontSize(12).font("Helvetica-Bold").text(title);
      doc.moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).strokeColor("#444").lineWidth(0.5).stroke();
      doc.moveDown(0.4);
    };

    // === EN-TÊTE ===
    doc.fontSize(18).font("Helvetica-Bold").text("PROCÈS-VERBAL DE RESTITUTION", left, doc.y, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(`Date: ${formatDate(new Date())}`, { align: "center" });
    doc.moveDown(0.8);

    // === INFOS GARAGE ===
    if (garage) {
      section("Établissement");
      row("Raison sociale", asText(garage.name));
      row("Adresse", asText(garage.address));
      row("Téléphone", asText(garage.phone));
      row("SIRET", asText(garage.siret));
    }

    // === INFOS CLIENT ===
    section("Client");
    row("Nom", `${client.firstName} ${client.lastName}`);
    row("Téléphone", asText(client.phone));
    row("Email", asText(client.email));

    // === INFOS VÉHICULE ===
    section("Véhicule");
    row("Immatriculation", intervention.vehicle.plate, true);
    row("Marque / Modèle", `${intervention.vehicle.brand} ${intervention.vehicle.model}`);
    row("VIN", asText(intervention.vehicle.vin));
    row("Kilométrage entrée", intv.odometerKm ? `${intv.odometerKm} km` : "Non renseigné");

    // === DATES ===
    section("Dates");
    row("Date de réception", formatDateTime(intervention.createdAt));
    row("Date de restitution", formatDateTime(intv.closedAt || new Date()));

    // === TRAVAUX RÉALISÉS ===
    section("Travaux réalisés");
    row("Type d'intervention", intervention.type);
    if (intv.tags && intv.tags.length > 0) {
      row("Catégories", intv.tags.join(", "));
    }

    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica-Bold").text("Description des travaux:", left, doc.y);
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(10).text(
      asText(intv.workNotes, "Aucune description des travaux"),
      { width: contentWidth }
    );

    if (intv.partsNotes) {
      doc.moveDown(0.4);
      doc.fontSize(10).font("Helvetica-Bold").text("Pièces utilisées:", left, doc.y);
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(10).text(intv.partsNotes, { width: contentWidth });
    }

    // === MONTANT ===
    if (intv.amountCents) {
      doc.moveDown(0.5);
      row("Montant total", `${(intv.amountCents / 100).toFixed(2)} € TTC`, true);
    }

    // === CONTRÔLES DE SORTIE ===
    section("Contrôles de sortie");
    
    if (intv.outtakeChecklist) {
      const oc = intv.outtakeChecklist;
      const checks: string[] = [];
      const unchecks: string[] = [];
      
      if (oc.roadTest) checks.push("Essai routier effectué"); else unchecks.push("Essai routier");
      if (oc.lightsOff) checks.push("Voyants éteints"); else unchecks.push("Voyants éteints");
      if (oc.clean) checks.push("Véhicule propre"); else unchecks.push("Véhicule propre");
      if (oc.clientBriefed) checks.push("Client informé"); else unchecks.push("Client informé");
      
      if (checks.length > 0) {
        doc.fontSize(10).font("Helvetica-Bold").text("✓ Validés:", left, doc.y);
        doc.moveDown(0.2);
        doc.font("Helvetica").fontSize(10).text(checks.join(", "), left + 10, doc.y, { width: contentWidth - 10 });
        doc.moveDown(0.3);
      }
      
      if (unchecks.length > 0) {
        doc.fontSize(10).font("Helvetica-Bold").text("○ Non validés:", left, doc.y);
        doc.moveDown(0.2);
        doc.font("Helvetica").fontSize(10).text(unchecks.join(", "), left + 10, doc.y, { width: contentWidth - 10 });
      }
    } else {
      doc.fontSize(10).font("Helvetica").text("Aucun contrôle de sortie renseigné", left, doc.y);
    }

    // === DOCUMENTS DE SORTIE ===
    if (intervention.documents && intervention.documents.length > 0) {
      const exitDocs = intervention.documents.filter((d: any) => d.category === "SORTIE");
      if (exitDocs.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica-Bold").text("Documents joints à la sortie:", left, doc.y);
        doc.moveDown(0.2);
        exitDocs.forEach((d: any, i: number) => {
          doc.font("Helvetica").fontSize(9).text(`  ${i + 1}. ${d.fileName}`, left, doc.y);
        });
      }
    }

    // === RÉSERVES ===
    section("Réserves éventuelles");
    doc.fontSize(9).font("Helvetica").text(
      "Le client peut noter ci-dessous toute réserve concernant les travaux ou l'état du véhicule:",
      left, doc.y, { width: contentWidth }
    );
    doc.moveDown(0.5);
    // Lignes vides pour notes manuscrites
    for (let i = 0; i < 3; i++) {
      doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ccc").lineWidth(0.3).stroke();
      doc.moveDown(0.6);
    }

    // === ATTESTATION ===
    section("Attestation de restitution");
    doc.fontSize(9).font("Helvetica").text(
      "Je soussigné(e) reconnais avoir récupéré le véhicule décrit ci-dessus en bon état de fonctionnement, " +
      "sous réserve des observations mentionnées. Les travaux ont été exécutés conformément à l'ordre de réparation initial.",
      left, doc.y, { width: contentWidth }
    );

    // === SIGNATURES ===
    doc.moveDown(1.5);
    const sigY = doc.y;
    const sigWidth = (contentWidth - 40) / 2;

    doc.fontSize(10).font("Helvetica-Bold").text("Signature client", left, sigY);
    doc.fontSize(8).font("Helvetica").text("(Précédée de la mention \"Bon pour accord\")", left, sigY + 12);
    doc.rect(left, sigY + 28, sigWidth, 60).stroke();

    doc.fontSize(10).font("Helvetica-Bold").text("Signature établissement", left + sigWidth + 40, sigY);
    doc.fontSize(8).font("Helvetica").text("Date et cachet", left + sigWidth + 40, sigY + 12);
    doc.rect(left + sigWidth + 40, sigY + 28, sigWidth, 60).stroke();

    // === FOOTER ===
    doc.moveDown(4);
    doc.fontSize(8).font("Helvetica").fillColor("#666").text(
      `Document généré le ${formatDateTime(new Date())} - Réf. ${intervention.id}`,
      left, doc.y, { align: "center", width: contentWidth }
    );

    doc.end();
    const pdfBuffer = await done;

    const plate = intervention.vehicle.plate.replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `PV_Restitution_${plate}_${formatDate(new Date()).replace(/\s/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erreur API PDF /api/interventions/[id]/delivery/pdf :", err);
    return toErrorResponse(err);
  }
}
