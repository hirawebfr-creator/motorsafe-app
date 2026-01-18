import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { failure, success } from "@/lib/api";
import { isGarageSubscriptionActive } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/**
 * MOBILE-UX-01: Detect device type from User-Agent for audit trail
 * Returns device info without PII
 */
function parseDeviceInfo(userAgent: string): { deviceType: "mobile" | "tablet" | "desktop"; os: string; browser: string } {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
  if (/ipad|android(?!.*mobile)|tablet/i.test(userAgent)) {
    deviceType = "tablet";
  } else if (/iphone|android.*mobile|mobile/i.test(userAgent)) {
    deviceType = "mobile";
  }
  
  // Detect OS
  let os = "unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") || ua.includes("macos")) os = "macOS";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("linux")) os = "Linux";
  
  // Detect browser
  let browser = "unknown";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";
  
  return { deviceType, os, browser };
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;

    if (!token) {
      return NextResponse.json(failure("Token manquant"), { status: 400 });
    }

    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { token },
      include: { garage: { select: { id: true, plan: true, subscriptionStatus: true } } },
    });

    if (!signatureRequest) {
      return NextResponse.json(failure("Demande introuvable"), { status: 404 });
    }

    // BILLING-GUARD-01: Check garage subscription (allow if already signed)
    if (signatureRequest.status !== "SIGNED" && !isGarageSubscriptionActive(signatureRequest.garage)) {
      return NextResponse.json(
        { ok: false, error: { code: "SUBSCRIPTION_INACTIVE", message: "Le garage n'a pas d'abonnement actif." } },
        { status: 402 }
      );
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
    
    // MOBILE-UX-01: Parse device info for audit trail (no PII)
    const deviceInfo = parseDeviceInfo(userAgent);

    // Update to VIEWED if not already
    if (signatureRequest.status === "SENT") {
      await prisma.signatureRequest.update({
        where: { id: signatureRequest.id },
        data: {
          status: "VIEWED",
          lastViewedAt: new Date(),
        },
      });

      // Create event with device info
      await prisma.signatureEvent.create({
        data: {
          signatureRequestId: signatureRequest.id,
          type: "VIEWED",
          ip,
          userAgent,
          metaJson: JSON.stringify({
            deviceType: deviceInfo.deviceType,
            os: deviceInfo.os,
            browser: deviceInfo.browser,
            viewedAt: new Date().toISOString(),
          }),
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
