import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { requireActiveSubscription, requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function asText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
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
        revisions: { orderBy: { createdAt: "desc" } },
        documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

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
    row("Realisee le", formatDate(intervention.performedAt));

    doc.moveDown(0.4);
    doc.fontSize(13).font("Helvetica-Bold").text("Client", { underline: true });
    doc.moveDown(0.2);
    row("Nom", `${intervention.vehicle.client.firstName} ${intervention.vehicle.client.lastName}`);
    row("Client ID", String(intervention.vehicle.client.id));

    doc.moveDown(0.3);
    doc.fontSize(13).font("Helvetica-Bold").text("Vehicule", { underline: true });
    doc.moveDown(0.2);
    row("Immatriculation", intervention.vehicle.plate);
    row("Marque / Modele", `${intervention.vehicle.brand} ${intervention.vehicle.model}`);
    row("VIN", asText(intervention.vehicle.vin));
    row("Carburant", asText(intervention.vehicle.fuel));

    doc.moveDown(0.3);
    doc.fontSize(13).font("Helvetica-Bold").text("Intervention", { underline: true });
    doc.moveDown(0.2);
    row("Type", intervention.type);
    row(
      "Kilometrage",
      intervention.odometerKm !== null && intervention.odometerKm !== undefined
        ? `${intervention.odometerKm} km`
        : "-"
    );
    row("ECU", asText(intervention.ecuType));
    row("Version soft", asText(intervention.softwareVersion));
    row("Checksum", asText(intervention.checksum));

    // FLOW-INT-01: Tags
    const intv = intervention as any;
    if (intv.tags && intv.tags.length > 0) {
      doc.moveDown(0.2);
      row("Types", intv.tags.join(", "));
    }

    // FLOW-INT-01: Intake checklist
    if (intv.intakeChecklist) {
      doc.moveDown(0.3);
      doc.fontSize(13).font("Helvetica-Bold").text("Reception (entree)", { underline: true });
      doc.moveDown(0.2);
      const checks = intv.intakeChecklist;
      const items = [];
      if (checks.lights) items.push("Voyants allumes");
      if (checks.noises) items.push("Bruits anormaux");
      if (checks.leaks) items.push("Fuites");
      if (checks.smoke) items.push("Fumee");
      if (checks.bodyDamage) items.push("Degats carrosserie");
      row("Anomalies signalees", items.length > 0 ? items.join(", ") : "Aucune");
    }
    if (intv.intakeNotes) {
      doc.moveDown(0.2);
      doc.fontSize(11).font("Helvetica-Bold").text("Symptomes client", { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(11).font("Helvetica").text(intv.intakeNotes, { width: right - left });
    }

    // FLOW-INT-01: Agreement
    if (intv.agreementAt) {
      doc.moveDown(0.3);
      doc.fontSize(13).font("Helvetica-Bold").text("Accord client", { underline: true });
      doc.moveDown(0.2);
      row("Date accord", formatDate(intv.agreementAt));
      row("Methode", intv.agreementMethod || "in_app");
      if (intv.amountCents) {
        row("Montant estime", (intv.amountCents / 100).toFixed(2) + " EUR");
      }
    }

    // FLOW-INT-01: Work notes
    if (intv.workNotes || intv.partsNotes) {
      doc.moveDown(0.3);
      doc.fontSize(13).font("Helvetica-Bold").text("Travaux effectues", { underline: true });
      doc.moveDown(0.2);
      if (intv.workNotes) {
        doc.fontSize(11).font("Helvetica").text(intv.workNotes, { width: right - left });
        doc.moveDown(0.2);
      }
      if (intv.partsNotes) {
        doc.fontSize(11).font("Helvetica-Bold").text("Pieces utilisees:", { continued: true });
        doc.font("Helvetica").text(" " + intv.partsNotes, { width: right - left - 100 });
      }
    }

    // FLOW-INT-01: Outtake
    if (intv.closedAt || intv.outtakeChecklist) {
      doc.moveDown(0.3);
      doc.fontSize(13).font("Helvetica-Bold").text("Sortie / Restitution", { underline: true });
      doc.moveDown(0.2);
      if (intv.closedAt) {
        row("Cloturee le", formatDate(intv.closedAt));
      }
      if (intv.outtakeChecklist) {
        const oc = intv.outtakeChecklist;
        const checks = [];
        if (oc.roadTest) checks.push("Essai OK");
        if (oc.lightsOff) checks.push("Voyants eteints");
        if (oc.clean) checks.push("Vehicule propre");
        if (oc.clientBriefed) checks.push("Client informe");
        row("Controles sortie", checks.length > 0 ? checks.join(", ") : "Non renseigne");
      }
    }

    // FLOW-INT-01: Documents list
    if (intervention.documents && intervention.documents.length > 0) {
      doc.moveDown(0.3);
      doc.fontSize(13).font("Helvetica-Bold").text("Documents lies", { underline: true });
      doc.moveDown(0.2);
      const categoryLabels: Record<string, string> = {
        ENTREE: "Entree",
        SORTIE: "Sortie",
        DIAGNOSTIC: "Diagnostic",
        PIECES: "Pieces",
        DIVERS: "Divers",
      };
      intervention.documents.forEach((d: any, idx: number) => {
        const catLabel = categoryLabels[d.category] || "Divers";
        row(`Doc ${idx + 1}`, `[${catLabel}] ${d.fileName} (${formatDate(d.createdAt)})`);
      });
    }

    if (intervention.notes) {
      doc.moveDown(0.2);
      doc.fontSize(11).font("Helvetica-Bold").text("Notes", { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(11).font("Helvetica").text(intervention.notes, { width: right - left });
    }

    doc.moveDown(0.4);
    doc.fontSize(13).font("Helvetica-Bold").text("Traceabilite", { underline: true });
    doc.moveDown(0.2);
    row("IP", asText(intervention.clientIp));
    row("User-Agent", asText(intervention.userAgent));
    if (intervention.createdBy) row("Cree par", String(intervention.createdBy));

    if (intervention.hash) {
      doc.moveDown(0.2);
      doc.fontSize(11).font("Helvetica-Bold").text("Hash (preuve d'integrite)", { underline: true });
      doc.moveDown(0.2);
      doc.font("Courier").fontSize(9).text(intervention.hash, { width: right - left });
      doc.font("Helvetica");
    }

    if (intervention.payload) {
      doc.moveDown(0.2);
      doc.fontSize(11).font("Helvetica-Bold").text("Payload (snapshot)", { underline: true });
      doc.moveDown(0.2);
      doc.font("Courier").fontSize(8).text(intervention.payload, { width: right - left });
      doc.font("Helvetica");
    }

    if (intervention.revisions?.length) {
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").text("Historique des revisions", { underline: true });
      doc.moveDown(0.6);

      intervention.revisions.forEach((rev, idx) => {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(`Revision ${idx + 1} - ${formatDate(rev.createdAt)}`);
        doc.fontSize(9).font("Courier").text(`HASH: ${rev.hash}`);
        doc.font("Helvetica").moveDown(0.2);
        doc.fontSize(9).font("Courier").text(rev.payload, { width: right - left });
        doc.font("Helvetica").moveDown();
      });
    }

    doc.addPage();
    doc.fontSize(12).font("Helvetica-Bold").text("Signature client", left, doc.y);
    doc.moveDown(2);
    doc.moveTo(left, doc.y).lineTo(right - 200, doc.y).strokeColor("#999").stroke();
    doc.moveDown(2);
    doc.fontSize(12).font("Helvetica-Bold").text("Signature technicien", left, doc.y);
    doc.moveDown(2);
    doc.moveTo(left, doc.y).lineTo(right - 200, doc.y).strokeColor("#999").stroke();

    doc.end();
    const pdfBuffer = await done;

    const filename = `dossier-intervention-${intervention.id}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erreur API PDF /api/interventions/[id]/pdf :", err);
    return toErrorResponse(err);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    requireActiveSubscription(user);

    const { id } = await ctx.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide", undefined, "BAD_REQUEST"), { status: 400 });
    }

    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      include: { vehicle: { include: { client: true } } },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable", undefined, "NOT_FOUND"), { status: 404 });
    }

    // Generate a simple PDF (reuse the GET content layout without revisions).
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
    doc.moveDown(0.6);
    doc.fontSize(16).font("Helvetica-Bold").text("Rapport d'intervention");
    doc.moveTo(left, doc.y + 4).lineTo(right, doc.y + 4).strokeColor("#444").stroke();
    doc.moveDown(0.8);

    row("ID", intervention.id);
    row("Type", intervention.type);
    row("Client", `${intervention.vehicle.client.firstName} ${intervention.vehicle.client.lastName}`);
    row("Vehicule", `${intervention.vehicle.brand} ${intervention.vehicle.model}`);
    row("Plaque", intervention.vehicle.plate);
    if (intervention.notes) {
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica-Bold").text("Notes", { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(11).font("Helvetica").text(intervention.notes, { width: right - left });
    }

    doc.end();
    const pdfBuffer = await done;

    const uploadsDir = path.join(process.cwd(), "uploads", "pdf");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `intervention-${intervention.id}.pdf`;
    const key = `pdf/${fileName}`;
    const absPath = path.join(process.cwd(), "uploads", key);
    await writeFile(absPath, pdfBuffer);

    const fileUrl = `/api/uploads/file/${key}`;

    const document = await prisma.document.create({
      data: {
        garageId: intervention.garageId,
        vehicleId: intervention.vehicleId,
        interventionId: intervention.id,
        type: "INTERVENTION_REPORT",
        fileUrl,
        fileName,
        mime: "application/pdf",
        size: pdfBuffer.length,
      },
    });

    return NextResponse.json(success(document), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST PDF /api/interventions/[id]/pdf :", err);
    return toErrorResponse(err);
  }
}
