/**
 * POST /api/interventions/[id]/insurance/send
 * Send Insurance Info PDF to client by email
 */

import { NextResponse } from "next/server";
import { requireActiveSubscription, requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { failure, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { decryptClientData } from "@/lib/encryption";
import { randomBytes, createHash } from "crypto";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Generate a secure random token and its hash
function generateDownloadToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

// Get Resend client
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function getMailFrom(): string {
  return process.env.MAIL_FROM || "MotorSafe <noreply@motorsafe.fr>";
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    requireActiveSubscription(user);

    const { id } = await ctx.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(failure("ID invalide"), { status: 400 });
    }

    // Fetch intervention with client and garage
    const intervention = await prisma.intervention.findFirst({
      where: user.role === "ADMIN"
        ? { id, deletedAt: null }
        : { id, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicle: { include: { client: true } },
        garage: true,
      },
    });

    if (!intervention) {
      return NextResponse.json(failure("Intervention introuvable"), { status: 404 });
    }

    // Decrypt client data to get email
    const clientRaw = intervention.vehicle.client as Record<string, unknown>;
    const client = decryptClientData(clientRaw) as {
      firstName: string;
      lastName: string;
      email?: string;
    };

    if (!client.email) {
      return NextResponse.json(failure("Le client n'a pas d'adresse email renseignée"), { status: 400 });
    }

    const garage = intervention.garage;
    const garageName = garage?.displayName || garage?.name || "MotorSafe";

    // Create download token (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenData = generateDownloadToken();

    // Upsert download token for INSURANCE_PDF purpose
    await prisma.downloadToken.upsert({
      where: { interventionId_purpose: { interventionId: id, purpose: "INSURANCE_PDF" } },
      update: {
        tokenHash: tokenData.hash,
        expiresAt,
        usedAt: null,
      },
      create: {
        interventionId: id,
        purpose: "INSURANCE_PDF",
        tokenHash: tokenData.hash,
        expiresAt,
      },
    });

    // Build download URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const downloadUrl = `${baseUrl}/api/download/insurance/${tokenData.token}`;

    // Send email
    const resend = getResendClient();
    if (!resend) {
      console.log("[Email] Skipping insurance email (no API key configured):", client.email);
      return NextResponse.json(success({ sent: false, reason: "email_not_configured", downloadUrl }));
    }

    const expirationDate = expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document à transmettre à votre assurance</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #4ADE80; margin: 0; font-size: 24px;">📄 Document assurance</h1>
    <p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">Bonjour ${client.firstName},</p>
    
    <p>
      Suite à l'intervention sur votre véhicule, nous vous transmettons un document récapitulatif 
      <strong>à conserver et/ou à transmettre à votre assurance</strong> si nécessaire.
    </p>
    
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400E;">
        ⚠️ Selon votre contrat d'assurance, certaines modifications peuvent nécessiter une déclaration. 
        Nous vous invitons à vérifier auprès de votre assureur.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" 
         style="display: inline-block; background: #4ADE80; color: #1a1a2e; padding: 14px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Télécharger l'attestation (PDF)
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Ce lien expire le <strong>${expirationDate}</strong>. Pensez à télécharger votre document.
    </p>
    
    ${garage?.phone || garage?.email ? `
    <p style="font-size: 13px; color: #666; margin-top: 16px;">
      Pour toute question : ${[garage?.phone, garage?.email].filter(Boolean).join(" • ")}
    </p>
    ` : ""}
    
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">
    
    <p style="font-size: 13px; color: #888; margin-bottom: 0;">
      Ce document est fourni à titre informatif et ne constitue pas un conseil juridique.
    </p>
  </div>
  
  <div style="background: #1a1a2e; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #888; font-size: 12px; margin: 0;">
      Envoyé via MotorSafe — Gestion digitale pour professionnels auto
    </p>
  </div>
</body>
</html>
    `.trim();

    const textContent = `
Bonjour ${client.firstName},

Suite à l'intervention sur votre véhicule, nous vous transmettons un document récapitulatif à conserver et/ou à transmettre à votre assurance si nécessaire.

⚠️ Selon votre contrat d'assurance, certaines modifications peuvent nécessiter une déclaration. Nous vous invitons à vérifier auprès de votre assureur.

Télécharger l'attestation (PDF) : ${downloadUrl}

Ce lien expire le ${expirationDate}. Pensez à télécharger votre document.

${garage?.phone || garage?.email ? `Pour toute question : ${[garage?.phone, garage?.email].filter(Boolean).join(" • ")}` : ""}

---
Ce document est fourni à titre informatif et ne constitue pas un conseil juridique.

Envoyé via MotorSafe
    `.trim();

    try {
      const result = await resend.emails.send({
        from: getMailFrom(),
        to: client.email,
        subject: `Document à transmettre à votre assurance — ${garageName}`,
        html: htmlContent,
        text: textContent,
      });

      if (result.error) {
        console.error("[Email] Resend error:", result.error);
        return NextResponse.json(failure(`Erreur envoi email: ${result.error.message}`), { status: 500 });
      }

      console.log(`[Email] Sent insurance info to ${client.email}, messageId: ${result.data?.id}`);
      return NextResponse.json(success({ sent: true, messageId: result.data?.id, email: client.email }));
    } catch (emailErr) {
      console.error("[Email] Exception:", emailErr);
      return NextResponse.json(failure("Erreur lors de l'envoi de l'email"), { status: 500 });
    }
  } catch (err) {
    console.error("Erreur API POST /api/interventions/[id]/insurance/send :", err);
    return toErrorResponse(err);
  }
}
