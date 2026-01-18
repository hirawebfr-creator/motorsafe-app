/**
 * Email Service using Resend
 * Centralized email sending for signature requests and notifications
 * Supports mock mode for testing (EMAIL_PROVIDER=mock)
 */

import { Resend } from "resend";
import { addToOutbox, isTestMode } from "./testOutbox";
import { trackError } from "./observability";

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

// WHITE-LABEL-PARTNERS-01: Get public logo URL for garage
export function getGarageLogoUrl(garageId: number | null | undefined, hasLogo: boolean): string | undefined {
  if (!garageId || !hasLogo) return undefined;
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  if (!appUrl) return undefined;
  return `${appUrl}/api/public/garage-logo/${garageId}`;
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
  garageLogoUrl?: string; // WHITE-LABEL-PARTNERS-01: Optional logo URL
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// === Email Templates ===

function buildSignatureEmailHtml(params: SignatureEmailParams): string {
  const { signingUrl, clientName, garageName, garagePhone, garageEmail, documentType, expiresAt, garageLogoUrl } = params;
  
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

  // WHITE-LABEL-PARTNERS-01: Logo in header if available
  const logoHtml = garageLogoUrl 
    ? `<img src="${garageLogoUrl}" alt="${garageName || 'Logo'}" style="max-height: 50px; max-width: 150px; margin-bottom: 12px;" />`
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
    ${logoHtml}
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
      // Track email errors to Sentry (no PII in tracking)
      await trackError(new Error(result.error.message), {
        area: 'email',
        severity: 'error',
        operation: 'send_signature_email',
        metadata: { errorCode: result.error.name },
      });
      return { success: false, error: result.error.message };
    }

    console.log(`[Email] Sent signature email, messageId: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending email:", message);
    // Track exception
    await trackError(err instanceof Error ? err : new Error(message), {
      area: 'email',
      severity: 'error',
      operation: 'send_signature_email',
    });
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
  garageLogoUrl?: string; // WHITE-LABEL-PARTNERS-01: Optional logo URL
}

function buildQuoteEmailHtml(params: QuoteEmailParams): string {
  const { downloadUrl, clientName, garageName, garagePhone, garageEmail, quoteNumber, totalTTC, expiresAt, garageLogoUrl } = params;
  
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

  // WHITE-LABEL-PARTNERS-01: Logo in header if available
  const logoHtml = garageLogoUrl 
    ? `<img src="${garageLogoUrl}" alt="${garageName || 'Logo'}" style="max-height: 50px; max-width: 150px; margin-bottom: 12px;" />`
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
    ${logoHtml}
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
  garageLogoUrl?: string; // WHITE-LABEL-PARTNERS-01: Optional logo URL
}

function buildInvoiceEmailHtml(params: InvoiceEmailParams): string {
  const { downloadUrl, clientName, garageName, garagePhone, garageEmail, invoiceNumber, totalTTC, dueAt, expiresAt, garageLogoUrl } = params;
  
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

  // WHITE-LABEL-PARTNERS-01: Logo in header if available
  const logoHtml = garageLogoUrl 
    ? `<img src="${garageLogoUrl}" alt="${garageName || 'Logo'}" style="max-height: 50px; max-width: 150px; margin-bottom: 12px;" />`
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
    ${logoHtml}
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

// ============================================
// PAYMENTS-01: Payment Link Email
// ============================================

export interface PaymentLinkEmailParams {
  to: string;
  payUrl: string;
  clientName?: string;
  garageName?: string;
  garagePhone?: string;
  garageEmail?: string;
  invoiceNumber?: string;
  amountDue?: string;
  garageLogoUrl?: string; // WHITE-LABEL-PARTNERS-01: Optional logo URL
}

function buildPaymentLinkEmailHtml(params: PaymentLinkEmailParams): string {
  const { payUrl, clientName, garageName, garagePhone, garageEmail, invoiceNumber, amountDue, garageLogoUrl } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";

  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">Pour toute question : ${contactParts.join(" • ")}</p>`
    : "";

  // WHITE-LABEL-PARTNERS-01: Logo in header if available
  const logoHtml = garageLogoUrl 
    ? `<img src="${garageLogoUrl}" alt="${garageName || 'Logo'}" style="max-height: 50px; max-width: 150px; margin-bottom: 12px;" />`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lien de paiement</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    ${logoHtml}
    <h1 style="color: #10B981; margin: 0; font-size: 24px;">💳 Lien de paiement</h1>
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">${greeting}</p>
    
    <p>
      ${garageName ? `<strong>${garageName}</strong> vous envoie` : "Vous recevez"} 
      un lien de paiement pour la facture${invoiceNumber ? ` <strong>${invoiceNumber}</strong>` : ""}.
    </p>
    
    ${amountDue ? `<p style="font-size: 20px; font-weight: bold; color: #1a1a2e; text-align: center; margin: 24px 0;">Montant à régler: ${amountDue}</p>` : ""}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${payUrl}" 
         style="display: inline-block; background: #10B981; color: white; padding: 16px 40px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
        Payer maintenant
      </a>
    </div>
    
    <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="margin: 0; font-size: 13px; color: #666;">
        <strong>🔒 Paiement sécurisé</strong><br>
        Vous serez redirigé vers une page de paiement sécurisée Stripe. 
        Vos informations bancaires ne sont jamais stockées par ${garageName || "le garage"}.
      </p>
    </div>
    
    ${garageContactHtml}
    
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">
    
    <p style="font-size: 13px; color: #888; margin-bottom: 0;">
      Ce lien expire dans 24 heures. Si vous avez déjà réglé cette facture, veuillez ignorer cet email.
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

function buildPaymentLinkEmailText(params: PaymentLinkEmailParams): string {
  const { payUrl, clientName, garageName, invoiceNumber, amountDue } = params;
  
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";

  return `
${greeting}

${garageName ? `${garageName} vous envoie` : "Vous recevez"} un lien de paiement pour la facture${invoiceNumber ? ` ${invoiceNumber}` : ""}.
${amountDue ? `\nMontant à régler: ${amountDue}` : ""}

Payez en cliquant sur le lien ci-dessous :
${payUrl}

🔒 Paiement sécurisé via Stripe.

Ce lien expire dans 24 heures.

---
Envoyé via MotorSafe
  `.trim();
}

/**
 * PAYMENTS-01: Send payment link email to client
 */
export async function sendPaymentLinkEmail(params: PaymentLinkEmailParams): Promise<EmailResult> {
  const subjectGaragePart = params.garageName ? ` — ${params.garageName}` : "";
  const subject = `Lien de paiement${params.invoiceNumber ? ` facture ${params.invoiceNumber}` : ""}${subjectGaragePart}`;
  const html = buildPaymentLinkEmailHtml(params);

  if (isTestMode()) {
    const entry = addToOutbox({
      to: params.to,
      subject,
      html,
      metadata: { type: "payment_link", payUrl: params.payUrl },
    });
    console.log(`[Email:Mock] Stored payment link email to ${params.to}, id: ${entry.id}`);
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  
  if (!resend) {
    console.log("[Email] Skipping payment link email (no API key configured):", params.to);
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const result = await resend.emails.send({
      from: getMailFrom(),
      to: params.to,
      subject,
      html,
      text: buildPaymentLinkEmailText(params),
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`[Email] Sent payment link email to ${params.to}, messageId: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending payment link email:", message);
    return { success: false, error: message };
  }
}

// ============================================
// AUTOMATIONS-01: Reminder Email Templates
// ============================================

// === Signature Reminder ===

export interface SignatureReminderEmailParams {
  to: string;
  signingUrl: string;
  garageName?: string;
  garagePhone?: string;
  garageEmail?: string;
  expiresAt?: Date;
}

export async function sendSignatureReminderEmail(params: SignatureReminderEmailParams): Promise<EmailResult> {
  const { signingUrl, garageName, garagePhone, garageEmail, expiresAt } = params;
  
  const subject = `Rappel: Signature en attente${garageName ? ` — ${garageName}` : ""}`;
  
  const expirationText = expiresAt 
    ? `Ce lien expire le ${expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";

  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">Pour toute question : ${contactParts.join(" • ")}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel signature</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #FBBF24; margin: 0; font-size: 24px;">⏰ Rappel: Signature en attente</h1>
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">Bonjour,</p>
    
    <p>
      Vous avez un document en attente de signature. N'oubliez pas de le signer avant son expiration.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${signingUrl}" 
         style="display: inline-block; background: #4ADE80; color: #1a1a2e; padding: 14px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Signer maintenant
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      ${expirationText}
    </p>
    
    ${garageContactHtml}
  </div>
  
  <div style="background: #1a1a2e; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #888; font-size: 12px; margin: 0;">
      Envoyé via MotorSafe — Gestion digitale pour professionnels auto
    </p>
  </div>
</body>
</html>
  `.trim();

  if (isTestMode()) {
    const entry = addToOutbox({ to: params.to, subject, html, metadata: { type: "signature_reminder" } });
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  if (!resend) return { success: true, messageId: "skipped-no-api-key" };

  try {
    const result = await resend.emails.send({ from: getMailFrom(), to: params.to, subject, html });
    if (result.error) return { success: false, error: result.error.message };
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// === Quote Reminder ===

export interface QuoteReminderEmailParams {
  to: string;
  quoteNumber?: string;
  totalTTC?: string;
  garageName?: string;
  garagePhone?: string;
  garageEmail?: string;
  appUrl?: string;
}

export async function sendQuoteReminderEmail(params: QuoteReminderEmailParams): Promise<EmailResult> {
  const { quoteNumber, totalTTC, garageName, garagePhone, garageEmail } = params;
  
  const subject = `Rappel: Devis${quoteNumber ? ` ${quoteNumber}` : ""} en attente${garageName ? ` — ${garageName}` : ""}`;
  
  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">Pour accepter ce devis ou poser des questions : ${contactParts.join(" • ")}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel devis</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #FBBF24; margin: 0; font-size: 24px;">⏰ Rappel: Devis en attente</h1>
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">Bonjour,</p>
    
    <p>
      Nous vous rappelons qu'un devis${quoteNumber ? ` (${quoteNumber})` : ""} vous a été envoyé et reste en attente de votre retour.
    </p>
    
    ${totalTTC ? `<p style="font-size: 18px; font-weight: bold; color: #1a1a2e;">Montant TTC: ${totalTTC}</p>` : ""}
    
    <p style="font-size: 14px; color: #666;">
      N'hésitez pas à nous contacter pour toute question ou pour valider ce devis.
    </p>
    
    ${garageContactHtml}
  </div>
  
  <div style="background: #1a1a2e; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #888; font-size: 12px; margin: 0;">
      Envoyé via MotorSafe — Gestion digitale pour professionnels auto
    </p>
  </div>
</body>
</html>
  `.trim();

  if (isTestMode()) {
    const entry = addToOutbox({ to: params.to, subject, html, metadata: { type: "quote_reminder" } });
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  if (!resend) return { success: true, messageId: "skipped-no-api-key" };

  try {
    const result = await resend.emails.send({ from: getMailFrom(), to: params.to, subject, html });
    if (result.error) return { success: false, error: result.error.message };
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// === Invoice Reminder ===

export interface InvoiceReminderEmailParams {
  to: string;
  invoiceNumber?: string;
  totalTTC?: string;
  amountDue?: string;
  dueAt?: Date;
  garageName?: string;
  garagePhone?: string;
  garageEmail?: string;
}

export async function sendInvoiceReminderEmail(params: InvoiceReminderEmailParams): Promise<EmailResult> {
  const { invoiceNumber, totalTTC, amountDue, dueAt, garageName, garagePhone, garageEmail } = params;
  
  const subject = `Rappel: Facture${invoiceNumber ? ` ${invoiceNumber}` : ""} en attente de paiement${garageName ? ` — ${garageName}` : ""}`;
  
  const dueDateText = dueAt 
    ? `Échéance: ${dueAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
    : "";

  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageEmail) contactParts.push(`Email: ${garageEmail}`);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">Pour toute question : ${contactParts.join(" • ")}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel facture</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #EF4444; margin: 0; font-size: 24px;">⏰ Rappel: Facture en attente</h1>
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">Bonjour,</p>
    
    <p>
      Nous vous rappelons que la facture${invoiceNumber ? ` ${invoiceNumber}` : ""} reste en attente de règlement.
    </p>
    
    ${amountDue ? `<p style="font-size: 18px; font-weight: bold; color: #EF4444;">Montant restant dû: ${amountDue}</p>` : ""}
    ${totalTTC && amountDue !== totalTTC ? `<p style="font-size: 14px; color: #666;">Montant total TTC: ${totalTTC}</p>` : ""}
    ${dueDateText ? `<p style="font-size: 14px; color: #666;">${dueDateText}</p>` : ""}
    
    <p style="font-size: 14px; color: #666;">
      Merci de procéder au règlement dans les meilleurs délais.
    </p>
    
    ${garageContactHtml}
  </div>
  
  <div style="background: #1a1a2e; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #888; font-size: 12px; margin: 0;">
      Envoyé via MotorSafe — Gestion digitale pour professionnels auto
    </p>
  </div>
</body>
</html>
  `.trim();

  if (isTestMode()) {
    const entry = addToOutbox({ to: params.to, subject, html, metadata: { type: "invoice_reminder" } });
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  if (!resend) return { success: true, messageId: "skipped-no-api-key" };

  try {
    const result = await resend.emails.send({ from: getMailFrom(), to: params.to, subject, html });
    if (result.error) return { success: false, error: result.error.message };
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// === Quota Alert ===

export interface QuotaAlertEmailParams {
  to: string;
  garageName?: string;
  alerts: string[];
}

export async function sendQuotaAlertEmail(params: QuotaAlertEmailParams): Promise<EmailResult> {
  const { garageName, alerts } = params;
  
  const subject = `⚠️ Alerte quota${garageName ? ` — ${garageName}` : ""}`;
  
  const alertListHtml = alerts.map(a => `<li style="margin-bottom: 8px;">${a}</li>`).join("");

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerte quota</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #FBBF24; margin: 0; font-size: 24px;">⚠️ Alerte quota</h1>
    ${garageName ? `<p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>` : ""}
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">Bonjour,</p>
    
    <p>
      Votre consommation de quotas approche de la limite mensuelle :
    </p>
    
    <ul style="background: #fff3cd; padding: 16px 16px 16px 32px; border-radius: 6px; border-left: 4px solid #ffc107;">
      ${alertListHtml}
    </ul>
    
    <p style="font-size: 14px; color: #666;">
      Pour continuer à utiliser ces fonctionnalités sans interruption, vous pouvez passer au plan supérieur.
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

  if (isTestMode()) {
    const entry = addToOutbox({ to: params.to, subject, html, metadata: { type: "quota_alert" } });
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  if (!resend) return { success: true, messageId: "skipped-no-api-key" };

  try {
    const result = await resend.emails.send({ from: getMailFrom(), to: params.to, subject, html });
    if (result.error) return { success: false, error: result.error.message };
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================
// APPOINTMENTS-01: Appointment Reminder Email
// ============================================

export interface AppointmentReminderEmailParams {
  to: string;
  clientName?: string;
  garageName: string;
  garagePhone?: string;
  garageAddress?: string;
  appointmentTitle: string;
  appointmentDate: Date;
  reminderType: "J1" | "H2";
}

export async function sendAppointmentReminderEmail(params: AppointmentReminderEmailParams): Promise<EmailResult> {
  const {
    to,
    clientName,
    garageName,
    garagePhone,
    garageAddress,
    appointmentTitle,
    appointmentDate,
    reminderType,
  } = params;

  const dateStr = appointmentDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = appointmentDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const reminderText = reminderType === "J1" 
    ? "demain" 
    : "dans 2 heures";

  const subject = `Rappel RDV — ${garageName} — ${dateStr} à ${timeStr}`;

  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";

  const contactParts: string[] = [];
  if (garagePhone) contactParts.push(`Tél: ${garagePhone}`);
  if (garageAddress) contactParts.push(garageAddress);
  const garageContactHtml = contactParts.length > 0
    ? `<p style="font-size: 13px; color: #666; margin-top: 16px;">${contactParts.join(" — ")}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel RDV</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #60A5FA; margin: 0; font-size: 24px;">📅 Rappel RDV</h1>
    <p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p style="margin-top: 0;">${greeting}</p>
    
    <p>
      Nous vous rappelons votre rendez-vous <strong>${reminderText}</strong> :
    </p>
    
    <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; font-size: 16px;">${appointmentTitle}</p>
      <p style="margin: 8px 0 0 0; color: #1e40af;">
        📅 ${dateStr}<br>
        🕐 ${timeStr}
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">
      En cas d'empêchement, merci de nous prévenir le plus tôt possible.
    </p>
    
    ${garageContactHtml}
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
${greeting}

Nous vous rappelons votre rendez-vous ${reminderText} :

${appointmentTitle}
📅 ${dateStr}
🕐 ${timeStr}

En cas d'empêchement, merci de nous prévenir le plus tôt possible.

${contactParts.join("\n")}

— ${garageName}
  `.trim();

  if (isTestMode()) {
    const entry = addToOutbox({ to, subject, html, metadata: { type: "appointment_reminder", reminderType } });
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  if (!resend) return { success: true, messageId: "skipped-no-api-key" };

  try {
    const result = await resend.emails.send({ from: getMailFrom(), to, subject, html, text: textContent });
    if (result.error) return { success: false, error: result.error.message };
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    console.error("sendAppointmentReminderEmail error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// === MULTI-USER-ROLES-01: Team Invite Email ===

export interface TeamInviteEmailParams {
  to: string;
  inviteUrl: string;
  garageName: string;
  role: string;
  message?: string;
  expiresAt: Date;
}

function buildTeamInviteEmailHtml(params: TeamInviteEmailParams): string {
  const { inviteUrl, garageName, role, message, expiresAt } = params;
  const expirationDate = expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const messageHtml = message
    ? `<p style="background: #f0f0f0; padding: 12px; border-radius: 8px; font-style: italic; margin: 16px 0;">"${message}"</p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation équipe</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #4ADE80; margin: 0; font-size: 24px;">Invitation à rejoindre l'équipe</h1>
    <p style="color: #aaa; margin: 8px 0 0 0; font-size: 14px;">${garageName}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <p>Bonjour,</p>
    
    <p>
      <strong>${garageName}</strong> vous invite à rejoindre son équipe en tant que <strong>${role}</strong> sur MotorSafe.
    </p>
    
    ${messageHtml}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" 
         style="display: inline-block; background: #4ADE80; color: #1a1a2e; padding: 14px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accepter l'invitation
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Cette invitation expire le ${expirationDate}.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">
    
    <p style="font-size: 13px; color: #888; margin-bottom: 0;">
      Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
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

function buildTeamInviteEmailText(params: TeamInviteEmailParams): string {
  const { inviteUrl, garageName, role, message, expiresAt } = params;
  const expirationDate = expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const messageText = message ? `\nMessage: "${message}"\n` : "";

  return `
Bonjour,

${garageName} vous invite à rejoindre son équipe en tant que ${role} sur MotorSafe.
${messageText}
Cliquez sur le lien ci-dessous pour accepter l'invitation :
${inviteUrl}

Cette invitation expire le ${expirationDate}.

---
Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.

Envoyé via MotorSafe
  `.trim();
}

export async function sendTeamInviteEmail(params: TeamInviteEmailParams): Promise<EmailResult> {
  const { to, garageName } = params;
  const subject = `Invitation à rejoindre l'équipe de ${garageName}`;
  const html = buildTeamInviteEmailHtml(params);
  const text = buildTeamInviteEmailText(params);

  if (isTestMode()) {
    const entry = addToOutbox({ to, subject, html, metadata: { type: "team_invite", inviteUrl: params.inviteUrl } });
    console.log(`[Email:Mock] Stored team invite email to ${to}, id: ${entry.id}`);
    return { success: true, messageId: entry.id };
  }

  const resend = getResendClient();
  if (!resend) {
    console.log("[Email] Skipping team invite email (no API key configured):", to);
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    const result = await resend.emails.send({ from: getMailFrom(), to, subject, html, text });
    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }
    console.log(`[Email] Sent team invite email to ${to}, messageId: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Email] Exception sending team invite email:", message);
    return { success: false, error: message };
  }
}
