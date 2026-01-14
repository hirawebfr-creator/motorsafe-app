import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;

    if (!token) {
      return NextResponse.json(failure("Token manquant"), { status: 400 });
    }

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
    });

    if (!signatureRequest) {
      return NextResponse.json(failure("Demande de signature introuvable"), { status: 404 });
    }

    // Check expiration
    if (signatureRequest.expiresAt < new Date()) {
      return NextResponse.json(failure("Ce lien de signature a expiré"), { status: 410 });
    }

    if (!signatureRequest.pdfRoute) {
      return NextResponse.json(failure("PDF non disponible"), { status: 404 });
    }

    // Build internal PDF route (bypass auth for signature token)
    const origin = new URL(req.url).origin;
    const pdfUrl = `${origin}${signatureRequest.pdfRoute}?signatureToken=${token}`;

    // Proxy the PDF request
    try {
      const pdfRes = await fetch(pdfUrl);
      
      if (!pdfRes.ok) {
        // Fallback: try without token (internal fetch)
        const internalRes = await fetchPdfInternal(signatureRequest);
        if (internalRes) {
          return internalRes;
        }
        return NextResponse.json(failure("Impossible de récupérer le PDF"), { status: 500 });
      }

      const pdfBuffer = await pdfRes.arrayBuffer();

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="document.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch (fetchErr) {
      console.error("PDF fetch error:", fetchErr);
      // Try internal generation
      const internalRes = await fetchPdfInternal(signatureRequest);
      if (internalRes) {
        return internalRes;
      }
      return NextResponse.json(failure("Erreur lors de la récupération du PDF"), { status: 500 });
    }
  } catch (err) {
    console.error("Error GET /api/signatures/[token]/pdf:", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

// Fallback: generate PDF internally if proxy fails
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchPdfInternal(_signatureRequest: { documentType: string; documentId: string }): Promise<NextResponse | null> {
  try {
    // For now, return null to indicate we should use the proxy method
    // The PDF routes handle their own generation
    // In future, could add direct PDF generation here
    return null;
  } catch {
    return null;
  }
}
