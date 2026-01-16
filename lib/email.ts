/**
 * Email Service using Resend
 * Centralized email sending for signature requests and notifications
 * Supports mock mode for testing (EMAIL_PROVIDER=mock)
 */

import { Resend } from "resend";
import { addToOutbox, isTestMode } from "./testOutbox";

// Initialize Resend client (lazy - only when actually sending)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  // In test mode, don't use real Resend
  if (isTestMode()) {
    return null;
  }
  
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
  garagePhone?: string;
  garageEmail?: string;
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
  const { signingUrl, clientName, garageName, garagePhone, garageEmail, documentType, expiresAt } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const docLabel = documentType === "INTERVENTION_ORDER" 
    ? "l'ordre de réparation" 
    : documentType === "INTERVENTION_DELIVERY"
    ? "le PV de restitution"
    : "le document";
  
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  // Build garage contact info
  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">Pour toute question : ${contactParts.join(" • ")}</p>`
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
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
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
    
    ${garageContactHtml}
    
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
  const { signingUrl, clientName, garageName, garagePhone, garageEmail, documentType, expiresAt } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const docLabel = documentType === "INTERVENTION_ORDER" 
    ? "l'ordre de réparation" 
    : documentType === "INTERVENTION_DELIVERY"
    ? "le PV de restitution"
    : "le document";
  
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  // Build garage contact info
  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactText = contactParts.length > 0
    ? `\nPour toute question : ${contactParts.join(" • ")}`
    : "";

  return `
${greeting}

${garageName ? `${garageName} vous demande` : "On vous demande"} de signer ${docLabel} pour autoriser l'intervention sur votre véhicule.

Cliquez sur le lien ci-dessous pour signer :
${signingUrl}

${expirationText}
${garageContactText}

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
  // Build subject with garage name if available
  const subjectGaragePart = params.garageName ? ` — ${params.garageName}` : "";
  const subject = `Signature requise${subjectGaragePart}`;
  const html = buildSignatureEmailHtml(params);

  // Test mode: store in outbox instead of sending
  if (isTestMode()) {
    const entry = addToOutbox({
      to: params.to,
      subject,
      html,
      metadata: { type: "signature", signingUrl: params.signingUrl },
    });
    console.log(`[Email:Mock] Stored signature email to ${params.to}, id: ${entry.id}`);
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  
  if (!resend) {
    console.log("[Email] Skipping email (no API key configured):", params.to);
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const result = await resend.emails.send({
      from: getMailFrom(),
      to: params.to,
      subject,
      html,
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

// === Signature Confirmation Email ===

export interface SignatureConfirmationParams {
  to: string;
  clientName?: string;
  garageName?: string;
  garagePhone?: string;
  garageEmail?: string;
  signedPdfUrl: string;
  dossierZipUrl?: string; // Optional - may be garage only
  expiresAt: Date;
}

function buildConfirmationEmailHtml(params: SignatureConfirmationParams): string {
  const { clientName, garageName, garagePhone, garageEmail, signedPdfUrl, dossierZipUrl, expiresAt } = params;

  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const expirationDate = expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Build garage contact info
  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">Pour toute question : ${contactParts.join(" • ")}</p>`
    : "";

  const zipButtonHtml = dossierZipUrl
    ? `
      <a href="${dossierZipUrl}"
         style="display: inline-block; background: #374151; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-left: 12px;">
        📁 Dossier complet (ZIP)
      </a>`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signature confirmée</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #4ADE80; margin: 0; font-size: 24px;">✓ Signature confirmée</h1>
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
  </div>

  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">${greeting}</p>

    <p>
      Votre signature a bien été enregistrée. Vous pouvez télécharger votre document signé ci-dessous.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${signedPdfUrl}"
         style="display: inline-block; background: #4ADE80; color: #1a1a2e; padding: 14px 32px;
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        📄 Document signé (PDF)
      </a>
      ${zipButtonHtml}
    </div>

    <p style="font-size: 14px; color: #666; background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
      ⚠️ Ces liens expirent le <strong>${expirationDate}</strong>. Pensez à télécharger vos documents.
    </p>

    ${garageContactHtml}

    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">

    <p style="font-size: 13px; color: #888; margin-bottom: 0;">
      Ce document signé a valeur de preuve. Conservez-le précieusement.
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

function buildConfirmationEmailText(params: SignatureConfirmationParams): string {
  const { clientName, garagePhone, garageEmail, signedPdfUrl, dossierZipUrl, expiresAt } = params;

  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const expirationDate = expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactText = contactParts.length > 0
    ? `\nPour toute question : ${contactParts.join(" • ")}`
    : "";

  const zipText = dossierZipUrl ? `\nDossier complet (ZIP) : ${dossierZipUrl}` : "";

  return `
${greeting}

Votre signature a bien été enregistrée.

Document signé (PDF) : ${signedPdfUrl}${zipText}

⚠️ Ces liens expirent le ${expirationDate}. Pensez à télécharger vos documents.
${garageContactText}

---
Ce document signé a valeur de preuve. Conservez-le précieusement.

Envoyé via MotorSafe
  `.trim();
}

/**
 * Send signature confirmation email with download links
 */
export async function sendSignatureConfirmationEmail(params: SignatureConfirmationParams): Promise<EmailResult> {
  // Build subject with garage name if available
  const subjectGaragePart = params.garageName ? ` — ${params.garageName}` : "";
  const subject = `Signature confirmée${subjectGaragePart}`;
  const html = buildConfirmationEmailHtml(params);

  // Test mode: store in outbox instead of sending
  if (isTestMode()) {
    const entry = addToOutbox({
      to: params.to,
      subject,
      html,
      metadata: { type: "confirmation", pdfUrl: params.signedPdfUrl, zipUrl: params.dossierZipUrl },
    });
    console.log(`[Email:Mock] Stored confirmation email to ${params.to}, id: ${entry.id}`);
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();

  if (!resend) {
    console.log("[Email] Skipping confirmation email (no API key configured):", params.to);
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const result = await resend.emails.send({
      from: getMailFrom(),
      to: params.to,
      subject,
      html,
      text: buildConfirmationEmailText(params),
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[Email] Sent confirmation email to ${params.to}, messageId: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending confirmation email:", message);
    return { success: false, error: message };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// === QUOTE EMAIL TEMPLATES ===

export interface QuoteEmailParams {
  to: string;
  downloadUrl: string;
  clientName?: string;
  garageName?: string;
  garagePhone?: string;
  garageEmail?: string;
  quoteNumber?: string;
  totalTTC?: string;
  expiresAt?: Date;
}

function buildQuoteEmailHtml(params: QuoteEmailParams): string {
  const { downloadUrl, clientName, garageName, garagePhone, garageEmail, quoteNumber, totalTTC, expiresAt } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">Pour toute question : ${contactParts.join(" • ")}</p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre devis</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #4ADE80; margin: 0; font-size: 24px;">Votre devis${quoteNumber ? ` ${quoteNumber}` : ""}</h1>
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">${greeting}</p>
    
    <p>
      ${garageName ? `<strong>${garageName}</strong> vous envoie` : "Vous recevez"} 
      un devis pour les travaux sur votre véhicule.
    </p>
    
    ${totalTTC ? `<p style="font-size: 18px; font-weight: bold; color: #1a1a2e;">Montant TTC: ${totalTTC}</p>` : ""}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" 
         style="display: inline-block; background: #4ADE80; color: #1a1a2e; padding: 14px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Télécharger le devis
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      ${expirationText}
    </p>
    
    ${garageContactHtml}
    
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">
    
    <p style="font-size: 13px; color: #888; margin-bottom: 0;">
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
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

function buildQuoteEmailText(params: QuoteEmailParams): string {
  const { downloadUrl, clientName, garageName, quoteNumber, totalTTC, expiresAt } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  return `
${greeting}

${garageName ? `${garageName} vous envoie` : "Vous recevez"} un devis${quoteNumber ? ` (${quoteNumber})` : ""} pour les travaux sur votre véhicule.
${totalTTC ? `\nMontant TTC: ${totalTTC}` : ""}

Téléchargez le devis ici :
${downloadUrl}

${expirationText}

---
Envoyé via MotorSafe
  `.trim();
}

/**
 * Send quote email to client
 */
export async function sendQuoteEmail(params: QuoteEmailParams): Promise<EmailResult> {
  const subjectGaragePart = params.garageName ? ` — ${params.garageName}` : "";
  const subject = `Votre devis${params.quoteNumber ? ` ${params.quoteNumber}` : ""}${subjectGaragePart}`;
  const html = buildQuoteEmailHtml(params);

  if (isTestMode()) {
    const entry = addToOutbox({
      to: params.to,
      subject,
      html,
      metadata: { type: "quote", downloadUrl: params.downloadUrl },
    });
    console.log(`[Email:Mock] Stored quote email to ${params.to}, id: ${entry.id}`);
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  
  if (!resend) {
    console.log("[Email] Skipping quote email (no API key configured):", params.to);
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const result = await resend.emails.send({
      from: getMailFrom(),
      to: params.to,
      subject,
      html,
      text: buildQuoteEmailText(params),
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[Email] Sent quote email to ${params.to}, messageId: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending quote email:", message);
    return { success: false, error: message };
  }
}

// === INVOICE EMAIL ===

export interface InvoiceEmailParams {
  to: string;
  downloadUrl: string;
  clientName?: string;
  garageName?: string;
  garagePhone?: string;
  garageEmail?: string;
  invoiceNumber?: string;
  totalTTC?: string;
  dueAt?: Date;
  expiresAt?: Date;
}

function buildInvoiceEmailHtml(params: InvoiceEmailParams): string {
  const { downloadUrl, clientName, garageName, garagePhone, garageEmail, invoiceNumber, totalTTC, dueAt, expiresAt } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const dueDateText = dueAt 
    ? `Échéance: ${dueAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
    : "";
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">Pour toute question : ${contactParts.join(" • ")}</p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre facture</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #3B82F6; margin: 0; font-size: 24px;">Votre facture${invoiceNumber ? ` ${invoiceNumber}` : ""}</h1>
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">${greeting}</p>
    
    <p>
      ${garageName ? `<strong>${garageName}</strong> vous envoie` : "Vous recevez"} 
      la facture pour les travaux effectués sur votre véhicule.
    </p>
    
    ${totalTTC ? `<p style="font-size: 18px; font-weight: bold; color: #1a1a2e;">Montant TTC: ${totalTTC}</p>` : ""}
    ${dueDateText ? `<p style="font-size: 14px; color: #666;">${dueDateText}</p>` : ""}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" 
         style="display: inline-block; background: #3B82F6; color: white; padding: 14px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Télécharger la facture
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      ${expirationText}
    </p>
    
    ${garageContactHtml}
    
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">
    
    <p style="font-size: 13px; color: #888; margin-bottom: 0;">
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
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

function buildInvoiceEmailText(params: InvoiceEmailParams): string {
  const { downloadUrl, clientName, garageName, invoiceNumber, totalTTC, dueAt, expiresAt } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const dueDateText = dueAt 
    ? `Échéance: ${dueAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
    : "";
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  return `
${greeting}

${garageName ? `${garageName} vous envoie` : "Vous recevez"} la facture${invoiceNumber ? ` ${invoiceNumber}` : ""} pour les travaux effectués sur votre véhicule.
${totalTTC ? `\nMontant TTC: ${totalTTC}` : ""}
${dueDateText}

Téléchargez la facture ici :
${downloadUrl}

${expirationText}

---
Envoyé via MotorSafe
  `.trim();
}

/**
 * Send invoice email to client
 */
export async function sendInvoiceEmail(params: InvoiceEmailParams): Promise<EmailResult> {
  const subjectGaragePart = params.garageName ? ` — ${params.garageName}` : "";
  const subject = `Votre facture${params.invoiceNumber ? ` ${params.invoiceNumber}` : ""}${subjectGaragePart}`;
  const html = buildInvoiceEmailHtml(params);

  if (isTestMode()) {
    const entry = addToOutbox({
      to: params.to,
      subject,
      html,
      metadata: { type: "invoice", downloadUrl: params.downloadUrl },
    });
    console.log(`[Email:Mock] Stored invoice email to ${params.to}, id: ${entry.id}`);
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  
  if (!resend) {
    console.log("[Email] Skipping invoice email (no API key configured):", params.to);
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const result = await resend.emails.send({
      from: getMailFrom(),
      to: params.to,
      subject,
      html,
      text: buildInvoiceEmailText(params),
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[Email] Sent invoice email to ${params.to}, messageId: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending invoice email:", message);
    return { success: false, error: message };
  }
}
