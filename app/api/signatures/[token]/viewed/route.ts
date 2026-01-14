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

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
    });

    if (!signatureRequest) {
      return NextResponse.json(failure("Demande introuvable"), { status: 404 });
    }

    // Check expiration
    if (signatureRequest.expiresAt < new Date()) {
      return NextResponse.json(failure("Ce lien a expiré"), { status: 410 });
    }

    // Don't update if already signed
    if (signatureRequest.status === "SIGNED") {
      return NextResponse.json(success({ status: signatureRequest.status }));
    }

    // Get IP and User-Agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Update to VIEWED if not already
    if (signatureRequest.status === "SENT") {
      await prisma.signatureRequest.update({
        where: { id: signatureRequest.id },
        data: {
          status: "VIEWED",
          lastViewedAt: new Date(),
        },
      });

      // Create event
      await prisma.signatureEvent.create({
        data: {
          signatureRequestId: signatureRequest.id,
          type: "VIEWED",
          ip,
          userAgent,
        },
      });
    } else {
      // Just update lastViewedAt
      await prisma.signatureRequest.update({
        where: { id: signatureRequest.id },
        data: { lastViewedAt: new Date() },
      });
    }

    return NextResponse.json(success({ status: "VIEWED" }));
  } catch (err) {
    console.error("Error POST /api/signatures/[token]/viewed:", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
