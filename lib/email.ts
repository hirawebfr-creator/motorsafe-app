/**
 * Email Service using Resend
 * Centralized email sending for signature requests and notifications
 */

import { Resend } from "resend";

// Initialize Resend client (lazy - only when actually sending)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured - emails will be skipped");
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Default sender
function getMailFrom(): string {
  return process.env.MAIL_FROM || "MotorSafe <noreply@motorsafe.fr>";
}

// === Types ===

export interface SignatureEmailParams {
  to: string;
  signingUrl: string;
  clientName?: string;
  garageName?: string;
  documentType?: string;
  expiresAt?: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// === Email Templates ===

function buildSignatureEmailHtml(params: SignatureEmailParams): string {
  const { signingUrl, clientName, garageName, documentType, expiresAt } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const docLabel = documentType === "INTERVENTION_ORDER" 
    ? "l'ordre de réparation" 
    : documentType === "INTERVENTION_DELIVERY"
    ? "le PV de restitution"
    : "le document";
  
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signature requise</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #4ADE80; margin: 0; font-size: 24px;">Signature requise</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">${greeting}</p>
    
    <p>
      ${garageName ? `<strong>${garageName}</strong> vous demande` : "On vous demande"} 
      de signer ${docLabel} pour autoriser l'intervention sur votre véhicule.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${signingUrl}" 
         style="display: inline-block; background: #4ADE80; color: #1a1a2e; padding: 14px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Signer le document
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      ${expirationText}
    </p>
    
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">
    
    <p style="font-size: 13px; color: #888; margin-bottom: 0;">
      Si vous n'êtes pas à l'origine de cette demande ou avez déjà signé ce document, 
      vous pouvez ignorer cet email.
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
}

function buildSignatureEmailText(params: SignatureEmailParams): string {
  const { signingUrl, clientName, garageName, documentType, expiresAt } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const docLabel = documentType === "INTERVENTION_ORDER" 
    ? "l'ordre de réparation" 
    : documentType === "INTERVENTION_DELIVERY"
    ? "le PV de restitution"
    : "le document";
  
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  return `
${greeting}

${garageName ? `${garageName} vous demande` : "On vous demande"} de signer ${docLabel} pour autoriser l'intervention sur votre véhicule.

Cliquez sur le lien ci-dessous pour signer :
${signingUrl}

${expirationText}

---
Si vous n'êtes pas à l'origine de cette demande ou avez déjà signé ce document, vous pouvez ignorer cet email.

Envoyé via MotorSafe
  `.trim();
}

// === Send Functions ===

/**
 * Send signature request email to client
 */
export async function sendSignatureEmail(params: SignatureEmailParams): Promise<EmailResult> {
  const resend = getResendClient();
  
  if (!resend) {
    console.log("[Email] Skipping email (no API key configured):", params.to);
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const result = await resend.emails.send({
      from: getMailFrom(),
      to: params.to,
      subject: "Signature requise — Ordre de réparation",
      html: buildSignatureEmailHtml(params),
      text: buildSignatureEmailText(params),
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[Email] Sent signature email to ${params.to}, messageId: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending email:", message);
    return { success: false, error: message };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
