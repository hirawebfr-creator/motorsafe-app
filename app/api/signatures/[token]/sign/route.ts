import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;

    if (!token) {
      return NextResponse.json(failure("Token manquant"), { status: 400 });
    }

    const body = await req.json();
    const { signerName, signerEmail, accepted } = body;

    if (!signerName || typeof signerName !== "string" || signerName.trim().length < 2) {
      return NextResponse.json(failure("Nom et prénom requis (min 2 caractères)"), { status: 400 });
    }

    if (accepted !== true) {
      return NextResponse.json(failure("Vous devez accepter les termes pour signer"), { status: 400 });
    }

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
    });

    if (!signatureRequest) {
      return NextResponse.json(failure("Demande de signature introuvable"), { status: 404 });
    }

    // Check expiration
    if (signatureRequest.expiresAt < new Date()) {
      await prisma.signatureRequest.update({
        where: { id: signatureRequest.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(failure("Ce lien de signature a expiré"), { status: 410 });
    }

    // Check if already signed
    if (signatureRequest.status === "SIGNED") {
      return NextResponse.json(failure("Ce document a déjà été signé"), { status: 400 });
    }

    // Check if declined
    if (signatureRequest.status === "DECLINED") {
      return NextResponse.json(failure("Cette demande a été refusée"), { status: 400 });
    }

    // Get IP and User-Agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Update signature request
    const updated = await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: {
        status: "SIGNED",
        signerNameDeclared: signerName.trim(),
        signerEmail: signerEmail?.trim() || signatureRequest.signerEmail,
        signedAt: new Date(),
      },
    });

    // Create signed event with full audit trail
    await prisma.signatureEvent.create({
      data: {
        signatureRequestId: signatureRequest.id,
        type: "SIGNED",
        ip,
        userAgent,
        metaJson: {
          signerName: signerName.trim(),
          signerEmail: signerEmail?.trim() || null,
          pdfHash: signatureRequest.pdfHash,
          documentType: signatureRequest.documentType,
          documentId: signatureRequest.documentId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(success({
      status: "SIGNED",
      signedAt: updated.signedAt,
      message: "Document signé avec succès",
    }));
  } catch (err) {
    console.error("Error POST /api/signatures/[token]/sign:", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
