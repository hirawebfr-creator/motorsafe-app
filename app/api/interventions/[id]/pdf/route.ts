import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";

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
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    if (!isApprovedGarage(user)) {
      return NextResponse.json(failure("Compte en attente de validation."), { status: 403 });
    }

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id }
        : { id, garageId: user.garageId ?? -1 },
      include: {
        vehicle: { include: { client: true } },
        revisions: { orderBy: { createdAt: "desc" } },
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
    return NextResponse.json(failure("Erreur serveur PDF"), { status: 500 });
  }
}
