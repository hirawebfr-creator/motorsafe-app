import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { requireActiveSubscription, requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { decryptClientData } from "@/lib/encryption";
import { getLegalContent } from "@/content/legal";

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
    doc.fontSize(18).font("Helvetica-Bold").text("ORDRE DE RÉPARATION", left, doc.y, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(`Date: ${formatDate(new Date())}`, { align: "center" });
    doc.moveDown(0.8);

    // === INFOS GARAGE ===
    if (garage) {
      section("Établissement");
      row("Raison sociale", asText(garage.name));
      row("Adresse", asText(garage.address));
      row("Téléphone", asText(garage.phone));
      row("Email", asText(garage.email));
      row("SIRET", asText(garage.siret));
    }

    // === INFOS CLIENT ===
    section("Client");
    row("Nom", `${client.firstName} ${client.lastName}`);
    row("Téléphone", asText(client.phone));
    row("Email", asText(client.email));
    row("Adresse", asText(client.address));

    // === INFOS VÉHICULE ===
    section("Véhicule");
    row("Immatriculation", intervention.vehicle.plate, true);
    row("Marque / Modèle", `${intervention.vehicle.brand} ${intervention.vehicle.model}`);
    row("VIN", asText(intervention.vehicle.vin));
    row("Carburant", asText(intervention.vehicle.fuel));
    row("Année", asText(intervention.vehicle.year));
    row("Kilométrage entrée", intv.odometerKm ? `${intv.odometerKm} km` : "Non renseigné");
    row("Date réception", formatDateTime(intervention.createdAt));

    // === TYPE D'INTERVENTION ===
    section("Nature de l'intervention");
    row("Type principal", intervention.type);
    if (intv.tags && intv.tags.length > 0) {
      row("Catégories", intv.tags.join(", "));
    }

    // === ÉTAT D'ENTRÉE / SYMPTÔMES ===
    section("État d'entrée et symptômes");
    
    if (intv.intakeChecklist) {
      const checks = intv.intakeChecklist;
      const anomalies: string[] = [];
      if (checks.lights) anomalies.push("Voyants allumés");
      if (checks.noises) anomalies.push("Bruits anormaux");
      if (checks.leaks) anomalies.push("Fuites détectées");
      if (checks.smoke) anomalies.push("Fumée visible");
      if (checks.bodyDamage) anomalies.push("Dégâts carrosserie");
      row("Anomalies constatées", anomalies.length > 0 ? anomalies.join(", ") : "Aucune anomalie signalée");
    } else {
      row("Anomalies constatées", "Non renseigné");
    }

    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica-Bold").text("Symptômes décrits par le client:", left, doc.y);
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(10).text(asText(intv.intakeNotes, "Aucun symptôme décrit"), { width: contentWidth });

    // === DOCUMENTS D'ENTRÉE ===
    if (intervention.documents && intervention.documents.length > 0) {
      const entryDocs = intervention.documents.filter((d: any) => d.category === "ENTREE" || d.category === "DIAGNOSTIC");
      if (entryDocs.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica-Bold").text("Documents joints à l'entrée:", left, doc.y);
        doc.moveDown(0.2);
        entryDocs.forEach((d: any, i: number) => {
          doc.font("Helvetica").fontSize(9).text(`  ${i + 1}. ${d.fileName}`, left, doc.y);
        });
      }
    }

    // === ESTIMATION / ACCORD ===
    section("Estimation et accord");
    if (intv.amountCents) {
      row("Montant estimé", `${(intv.amountCents / 100).toFixed(2)} € TTC`);
    } else {
      row("Montant estimé", "À définir après diagnostic");
    }
    if (intv.agreementAt) {
      row("Accord client", `Validé le ${formatDateTime(intv.agreementAt)}`);
      row("Méthode accord", asText(intv.agreementMethod, "Application"));
    } else {
      row("Accord client", "En attente");
    }

    // === AUTORISATIONS ===
    section("Autorisations");
    doc.fontSize(9).font("Helvetica").text(
      "En signant le présent ordre de réparation, le client autorise l'établissement à:",
      left, doc.y, { width: contentWidth }
    );
    doc.moveDown(0.3);
    const authorizations = [
      "• Effectuer les essais routiers nécessaires au diagnostic et à la vérification des réparations",
      "• Procéder aux démontages requis pour établir un diagnostic précis",
      "• Réaliser les travaux décrits ci-dessus dans le respect des règles de l'art",
    ];
    authorizations.forEach((auth) => {
      doc.fontSize(9).font("Helvetica").text(auth, left + 10, doc.y, { width: contentWidth - 20 });
      doc.moveDown(0.2);
    });

    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica-Bold").text("Note importante:", left, doc.y);
    doc.font("Helvetica").text(
      "En cas de refus des réparations après diagnostic, les frais de diagnostic pourront être facturés selon le barème en vigueur.",
      left, doc.y + 12, { width: contentWidth }
    );

    // === OBSERVATIONS ===
    doc.moveDown(1);
    section("Observations");
    doc.fontSize(9).font("Helvetica").text("", left, doc.y);
    // Zone vide pour notes manuscrites
    doc.moveDown(3);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor("#ccc").lineWidth(0.3).stroke();
    doc.moveDown(0.5);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(0.5);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();

    // === RÉFÉRENCES LÉGALES ===
    const legalContent = getLegalContent(intervention.type);
    doc.moveDown(1);
    section("Références & clauses");
    doc.fontSize(9).font("Helvetica-Bold").text(legalContent.title, left, doc.y);
    doc.moveDown(0.3);
    legalContent.bullets.forEach((bullet) => {
      doc.font("Helvetica").fontSize(8).text(`• ${bullet}`, left + 10, doc.y, { width: contentWidth - 20 });
      doc.moveDown(0.2);
    });
    doc.moveDown(0.3);
    doc.fontSize(7).fillColor("#888").text(
      `Version: v1.0 | Date: ${formatDate(new Date())} | Document généré par MotorSafe`,
      left, doc.y, { width: contentWidth }
    );
    doc.fillColor("#000");

    // === SIGNATURES ===
    doc.moveDown(1.5);
    const sigY = doc.y;
    const sigWidth = (contentWidth - 40) / 2;

    // Client signature box with Yousign anchor
    doc.fontSize(10).font("Helvetica-Bold").text("Signature client", left, sigY);
    doc.fontSize(8).font("Helvetica").text("(Précédée de la mention \"Lu et approuvé\")", left, sigY + 12);
    doc.rect(left, sigY + 28, sigWidth, 60).stroke();
    // Yousign Smart Anchor - text invisible ou très petit pour le parsing
    doc.fontSize(4).fillColor("#fff").text("[[SIGN_CLIENT]]", left + 5, sigY + 35, { width: sigWidth - 10 });
    doc.fillColor("#000");

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
    const filename = `OR_${plate}_${formatDate(new Date()).replace(/\s/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erreur API PDF /api/interventions/[id]/order/pdf :", err);
    return toErrorResponse(err);
  }
}
