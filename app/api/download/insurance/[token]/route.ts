/**
 * GET /api/download/insurance/[token]
 * Public route to download Insurance Info PDF with secure token
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { buildInsuranceInfoPdf } from "@/lib/pdf/insuranceInfo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;

    if (!token || token.length < 32) {
      return NextResponse.json(
        { ok: false, error: "Lien invalide" },
        { status: 400 }
      );
    }

    // Hash the token to find in DB
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const downloadToken = await prisma.downloadToken.findUnique({
      where: { tokenHash },
      include: {
        intervention: {
          include: {
            garage: {
              select: { name: true, displayName: true, phone: true, email: true },
            },
          },
        },
      },
    });

    if (!downloadToken) {
      return NextResponse.json(
        { ok: false, error: "Lien invalide ou expiré" },
        { status: 404 }
      );
    }

    // Check expiration
    if (downloadToken.expiresAt < new Date()) {
      const garageName = downloadToken.intervention.garage?.displayName || downloadToken.intervention.garage?.name || "le garage";
      return NextResponse.json(
        {
          ok: false,
          error: "Ce lien a expiré",
          message: `Ce lien de téléchargement a expiré. Veuillez contacter ${garageName} pour obtenir un nouveau lien.`,
        },
        { status: 410 }
      );
    }

    // Check purpose
    if (downloadToken.purpose !== "INSURANCE_PDF") {
      return NextResponse.json(
        { ok: false, error: "Lien invalide pour ce type de téléchargement" },
        { status: 400 }
      );
    }

    // Generate the Insurance Info PDF
    const result = await buildInsuranceInfoPdf(downloadToken.interventionId);

    // Mark as used (first download)
    if (!downloadToken.usedAt) {
      await prisma.downloadToken.update({
        where: { id: downloadToken.id },
        data: { usedAt: new Date() },
      });
    }

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-PDF-Hash": result.sha256,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erreur API GET /api/download/insurance/[token] :", err);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la génération du document" },
      { status: 500 }
    );
  }
}
