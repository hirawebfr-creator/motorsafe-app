import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { Buffer } from "buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function asText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "ID invalide" }, { status: 400 });
    }

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: {
        vehicle: { include: { client: true } },
        revisions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!intervention) {
      return NextResponse.json({ ok: false, error: "Intervention introuvable" }, { status: 404 });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(18).text("Dossier d'intervention", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#444").text(`ID intervention: ${intervention.id}`);
    doc.text(`Cree le: ${new Date(intervention.createdAt).toLocaleString("fr-FR")}`);
    if (intervention.performedAt) {
      doc.text(`Realisee le: ${new Date(intervention.performedAt).toLocaleString("fr-FR")}`);
    }
    doc.moveDown();

    doc.fillColor("#000").fontSize(14).text("Client", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text(
      `${intervention.vehicle.client.firstName} ${intervention.vehicle.client.lastName}`
    );
    doc.text(`Client ID: ${intervention.vehicle.client.id}`);
    doc.moveDown();

    doc.fontSize(14).text("Vehicule", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text(`Immat: ${intervention.vehicle.plate}`);
    doc.text(
      `Marque / Modele: ${intervention.vehicle.brand} ${intervention.vehicle.model}`
    );
    if (intervention.vehicle.vin) doc.text(`VIN: ${intervention.vehicle.vin}`);
    if (intervention.vehicle.fuel) doc.text(`Carburant: ${intervention.vehicle.fuel}`);
    doc.moveDown();

    doc.fontSize(14).text("Intervention", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text(`Type: ${intervention.type}`);
    if (intervention.odometerKm !== null && intervention.odometerKm !== undefined) {
      doc.text(`Kilometrage: ${intervention.odometerKm} km`);
    }
    if (intervention.ecuType) doc.text(`ECU: ${intervention.ecuType}`);
    if (intervention.softwareVersion) {
      doc.text(`Version soft: ${intervention.softwareVersion}`);
    }
    if (intervention.checksum) doc.text(`Checksum: ${intervention.checksum}`);
    doc.moveDown(0.3);

    if (intervention.notes) {
      doc.fontSize(11).text("Notes:", { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(11).text(intervention.notes, { width: 500 });
      doc.moveDown();
    }

    doc.fontSize(14).text("Tracabilite", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text(`IP: ${asText(intervention.clientIp) || "?"}`);
    doc.text(`User-Agent: ${asText(intervention.userAgent) || "?"}`);
    if (intervention.createdBy) doc.text(`Cree par: ${intervention.createdBy}`);
    doc.moveDown(0.3);

    if (intervention.hash) {
      doc.fontSize(11).text("Hash (preuve d'integrite):", { underline: true });
      doc.moveDown(0.2);
      doc.font("Courier").fontSize(9).text(intervention.hash);
      doc.font("Helvetica");
      doc.moveDown();
    }

    if (intervention.payload) {
      doc.fontSize(11).text("Payload (snapshot):", { underline: true });
      doc.moveDown(0.2);
      doc.font("Courier").fontSize(8).text(intervention.payload, { width: 500 });
      doc.font("Helvetica");
      doc.moveDown();
    }

    if (intervention.revisions?.length) {
      doc.addPage();
      doc.fontSize(14).text("Historique des revisions", { underline: true });
      doc.moveDown(0.5);

      intervention.revisions.forEach((rev, idx) => {
        doc
          .fontSize(11)
          .text(`Revision ${idx + 1} - ${new Date(rev.createdAt).toLocaleString("fr-FR")}`);
        doc.fontSize(9).font("Courier").text(`HASH: ${rev.hash}`);
        doc.font("Helvetica").moveDown(0.2);
        doc.fontSize(9).font("Courier").text(rev.payload, { width: 500 });
        doc.font("Helvetica").moveDown();
        doc.moveDown(0.5);
      });
    }

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
    return NextResponse.json({ ok: false, error: "Erreur serveur PDF" }, { status: 500 });
  }
}
