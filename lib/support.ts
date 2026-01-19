/**
 * SUPPORT-OMNI-01: Support System Helpers
 * SUPPORT-SLA-01: SLA calculations and auto-priority
 * WhatsApp URL generation, email notifications, constants
 */

import { Resend } from "resend";
import { trackError } from "./observability";
import { addToOutbox, isTestMode } from "./testOutbox";
import type { SupportPriority, SupportCategory } from "@prisma/client";

// ============================================
// Constants
// ============================================

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "contact@safemotor.fr";
export const SUPPORT_WHATSAPP_E164 = process.env.SUPPORT_WHATSAPP_E164 || "33626045731";

// Rate limit configs for support
export const SUPPORT_RATE_LIMITS = {
  CREATE_TICKET: { limit: 5, windowSec: 3600 },        // 5 tickets/hour per user
  CREATE_MESSAGE: { limit: 20, windowSec: 3600 },      // 20 messages/hour per user
  PUBLIC_CONTACT: { limit: 3, windowSec: 3600 },       // 3 public forms/hour per IP
  SLA_ALERT_EMAIL: { limit: 3, windowSec: 3600 },      // 3 SLA alert emails/hour
};

// Message size limits
export const MESSAGE_MAX_LENGTH = 5000;
export const SUBJECT_MAX_LENGTH = 200;

// ============================================
// SUPPORT-SLA-01: SLA Configuration
// ============================================

/**
 * SLA delay in hours by priority (simple MVP - no business hours)
 */
export const SLA_HOURS: Record<SupportPriority, number> = {
  URGENT: 2,
  HIGH: 8,
  NORMAL: 24,
  LOW: 72,
};

/**
 * Calculate SLA target date based on priority
 */
export function calculateSlaTarget(priority: SupportPriority, fromDate?: Date): Date {
  const base = fromDate ?? new Date();
  const hours = SLA_HOURS[priority];
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Check if a ticket has breached its SLA
 */
export function isSlaBreached(slaTargetAt: Date | null): boolean {
  if (!slaTargetAt) return false;
  return new Date() > slaTargetAt;
}

/**
 * Get remaining time until SLA breach (negative if breached)
 */
export function getSlaRemainingMs(slaTargetAt: Date | null): number | null {
  if (!slaTargetAt) return null;
  return slaTargetAt.getTime() - Date.now();
}

// ============================================
// SUPPORT-SLA-01: Auto-Priority Rules
// ============================================

/**
 * Keywords that upgrade priority to HIGH
 */
const HIGH_PRIORITY_KEYWORDS = [
  "urgent",
  "urgente",
  "bloqué",
  "bloque",
  "bloquée",
  "impossible",
  "paiement bloqué",
  "signature bloquée",
  "ne fonctionne plus",
  "erreur critique",
  "perte de données",
];

/**
 * Auto-calculate priority based on category and message content
 */
export function calculateAutoPriority(
  category: SupportCategory,
  subject: string,
  message: string
): SupportPriority {
  const text = `${subject} ${message}`.toLowerCase();
  
  // Category-based rules
  if (category === "BILLING") return "HIGH";
  if (category === "LEGAL") return "HIGH";
  
  // Keyword-based upgrade
  const hasHighKeyword = HIGH_PRIORITY_KEYWORDS.some(kw => text.includes(kw));
  if (hasHighKeyword) return "HIGH";
  
  // Default by category
  if (category === "BUG") return "NORMAL";
  
  return "NORMAL";
}

// ============================================
// WhatsApp URL Generation
// ============================================

/**
 * Build WhatsApp URL with pre-filled message
 * @param ticketId - Optional ticket ID to include
 * @param garageName - Optional garage name
 */
export function buildWhatsAppUrl(ticketId?: string, garageName?: string): string {
  let message = "Bonjour, j'ai besoin d'aide sur SafeMotor.";
  
  if (ticketId) {
    message += ` Ticket: ${ticketId}.`;
  }
  if (garageName) {
    message += ` (Garage: ${garageName})`;
  }
  
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${encoded}`;
}

/**
 * Build mailto URL with pre-filled subject
 * @param ticketId - Optional ticket ID to include in subject
 */
export function buildMailtoUrl(ticketId?: string): string {
  let subject = "Demande de support SafeMotor";
  if (ticketId) {
    subject = `[Ticket ${ticketId}] ${subject}`;
  }
  const encoded = encodeURIComponent(subject);
  return `mailto:${SUPPORT_EMAIL}?subject=${encoded}`;
}

// ============================================
// Email Notifications
// ============================================

// Initialize Resend client (lazy)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (isTestMode()) return null;
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Support] RESEND_API_KEY not configured - emails will be skipped");
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getMailFrom(): string {
  return process.env.MAIL_FROM || "SafeMotor Support <noreply@safemotor.fr>";
}

interface TicketNotificationParams {
  ticketId: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  requesterName: string;
  garageName?: string;
  garageId?: number | null;
}

/**
 * Send email notification to support team when a ticket is created
 */
export async function sendTicketCreatedEmail(params: TicketNotificationParams): Promise<{ success: boolean; error?: string }> {
  const { ticketId, subject, category, priority, message, requesterName, garageName, garageId } = params;
  
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://safemotor.fr";
  const adminLink = `${appUrl}/admin/support?ticket=${ticketId}`;
  
  const emailSubject = `[Nouveau Ticket ${ticketId}] ${subject}`;
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouveau Ticket Support</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #4ADE80; margin: 0; font-size: 20px;">🎫 Nouveau Ticket Support</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; border-top: none;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666;">ID Ticket:</td>
        <td style="padding: 8px 0;">${ticketId}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666;">Sujet:</td>
        <td style="padding: 8px 0;">${escapeHtml(subject)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666;">Catégorie:</td>
        <td style="padding: 8px 0;">${category}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666;">Priorité:</td>
        <td style="padding: 8px 0;">${priority}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666;">Demandeur:</td>
        <td style="padding: 8px 0;">${escapeHtml(requesterName)}</td>
      </tr>
      ${garageName ? `
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #666;">Garage:</td>
        <td style="padding: 8px 0;">${escapeHtml(garageName)} (ID: ${garageId})</td>
      </tr>
      ` : ''}
    </table>
    
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
    
    <p style="font-weight: 600; color: #666; margin-bottom: 8px;">Message:</p>
    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e9ecef;">
      ${escapeHtml(message).replace(/\n/g, '<br>')}
    </div>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="${adminLink}" 
         style="display: inline-block; background: #4ADE80; color: #1a1a2e; padding: 12px 24px; 
                text-decoration: none; border-radius: 8px; font-weight: 600;">
        Voir le ticket
      </a>
    </div>
  </div>
  
  <div style="background: #1a1a2e; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #888; font-size: 12px; margin: 0;">
      SafeMotor Support System
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Nouveau Ticket Support

ID: ${ticketId}
Sujet: ${subject}
Catégorie: ${category}
Priorité: ${priority}
Demandeur: ${requesterName}
${garageName ? `Garage: ${garageName} (ID: ${garageId})` : ''}

Message:
${message}

Lien admin: ${adminLink}
  `.trim();

  // Test mode: store in outbox
  if (isTestMode()) {
    addToOutbox({
      to: SUPPORT_EMAIL,
      subject: emailSubject,
      html,
      metadata: { type: "support_ticket_created", ticketId },
    });
    return { success: true };
  }

  const client = getResendClient();
  if (!client) {
    console.warn("[Support] Email skipped (no Resend client)");
    return { success: false, error: "Email service not configured" };
  }

  try {
    await client.emails.send({
      from: getMailFrom(),
      to: SUPPORT_EMAIL,
      subject: emailSubject,
      html,
      text,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    trackError(err instanceof Error ? err : new Error(message), {
      area: "email",
      operation: "sendTicketCreatedEmail",
      metadata: { ticketId },
    });
    return { success: false, error: message };
  }
}

/**
 * Send acknowledgment email to ticket requester
 */
export async function sendTicketAcknowledgmentEmail(params: {
  ticketId: string;
  to: string;
  requesterName: string;
  subject: string;
}): Promise<{ success: boolean; error?: string }> {
  const { ticketId, to, requesterName, subject } = params;
  
  const emailSubject = `Votre demande a été reçue [${ticketId}]`;
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Confirmation de votre demande</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #4ADE80; margin: 0; font-size: 20px;">✅ Demande reçue</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; border-top: none;">
    <p>Bonjour ${escapeHtml(requesterName)},</p>
    
    <p>Nous avons bien reçu votre demande concernant:</p>
    <p style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #4ADE80;">
      <strong>${escapeHtml(subject)}</strong>
    </p>
    
    <p>Votre numéro de ticket: <strong>${ticketId}</strong></p>
    
    <p>Notre équipe vous répondra dans les plus brefs délais.</p>
    
    <p>Vous pouvez également nous contacter via WhatsApp pour un suivi plus rapide.</p>
  </div>
  
  <div style="background: #1a1a2e; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #888; font-size: 12px; margin: 0;">
      SafeMotor — Gestion digitale pour professionnels auto
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Bonjour ${requesterName},

Nous avons bien reçu votre demande concernant: ${subject}

Votre numéro de ticket: ${ticketId}

Notre équipe vous répondra dans les plus brefs délais.

SafeMotor
  `.trim();

  if (isTestMode()) {
    addToOutbox({ to, subject: emailSubject, html, metadata: { type: "support_ticket_ack", ticketId } });
    return { success: true };
  }

  const client = getResendClient();
  if (!client) {
    return { success: false, error: "Email service not configured" };
  }

  try {
    await client.emails.send({
      from: getMailFrom(),
      to,
      subject: emailSubject,
      html,
      text,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    trackError(err instanceof Error ? err : new Error(message), {
      area: "email",
      operation: "sendTicketAcknowledgmentEmail",
      metadata: { ticketId },
    });
    return { success: false, error: message };
  }
}

// ============================================
// Sanitization
// ============================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize message content (strip HTML, limit length)
 */
export function sanitizeMessage(input: string, maxLength = MESSAGE_MAX_LENGTH): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize subject (strip HTML, limit length)
 */
export function sanitizeSubject(input: string, maxLength = SUBJECT_MAX_LENGTH): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n]/g, " ") // No newlines in subject
    .trim()
    .slice(0, maxLength);
}

// ============================================
// SUPPORT-SLA-01: SLA Breach Notifications
// ============================================

interface SlaBreachEmailParams {
  ticketId: string;
  subject: string;
  priority: string;
  slaTargetAt: Date;
  breachDelayMinutes: number;
  garageName?: string;
}

/**
 * Send email notification when a ticket breaches its SLA
 */
export async function sendSlaBreachEmail(params: SlaBreachEmailParams): Promise<{ success: boolean; error?: string }> {
  const { ticketId, subject, priority, slaTargetAt, breachDelayMinutes, garageName } = params;
  
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.safemotor.fr";
  const adminLink = `${appUrl}/admin/support?ticket=${ticketId}`;
  
  const emailSubject = `⚠️ SLA Breach: Ticket #${ticketId} (${priority})`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SLA Breach Alert</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 2px solid #ef4444;">
    <div style="background: #ef4444; padding: 20px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">⚠️ SLA Breach Alert</h1>
    </div>
    
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Ticket ID:</td>
          <td style="padding: 8px 0; font-weight: bold;">#${escapeHtml(ticketId)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Sujet:</td>
          <td style="padding: 8px 0;">${escapeHtml(subject)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Priorité:</td>
          <td style="padding: 8px 0;"><span style="background: ${priority === 'URGENT' ? '#ef4444' : '#f97316'}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${priority}</span></td>
        </tr>
        ${garageName ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Garage:</td>
          <td style="padding: 8px 0;">${escapeHtml(garageName)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #666;">SLA Target:</td>
          <td style="padding: 8px 0;">${slaTargetAt.toLocaleString('fr-FR')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Retard:</td>
          <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">${breachDelayMinutes} minutes</td>
        </tr>
      </table>
      
      <div style="margin-top: 24px; text-align: center;">
        <a href="${adminLink}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Voir le ticket →
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
SLA BREACH ALERT

Ticket #${ticketId}
Sujet: ${subject}
Priorité: ${priority}
${garageName ? `Garage: ${garageName}` : ''}
SLA Target: ${slaTargetAt.toISOString()}
Retard: ${breachDelayMinutes} minutes

Lien admin: ${adminLink}
  `.trim();

  if (isTestMode()) {
    addToOutbox({
      to: SUPPORT_EMAIL,
      subject: emailSubject,
      html,
      metadata: { type: "sla_breach", ticketId, priority },
    });
    return { success: true };
  }

  const client = getResendClient();
  if (!client) {
    console.warn("[Support] SLA breach email skipped (no Resend client)");
    return { success: false, error: "Email service not configured" };
  }

  try {
    await client.emails.send({
      from: getMailFrom(),
      to: SUPPORT_EMAIL,
      subject: emailSubject,
      html,
      text,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    trackError(err instanceof Error ? err : new Error(message), {
      area: "email",
      operation: "sendSlaBreachEmail",
      metadata: { ticketId },
    });
    return { success: false, error: message };
  }
}

interface UrgentTicketEmailParams {
  ticketId: string;
  subject: string;
  requesterName: string;
  garageName?: string;
  message: string;
}

/**
 * Send email notification when an URGENT ticket is created
 */
export async function sendUrgentTicketEmail(params: UrgentTicketEmailParams): Promise<{ success: boolean; error?: string }> {
  const { ticketId, subject, requesterName, garageName, message } = params;
  
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.safemotor.fr";
  const adminLink = `${appUrl}/admin/support?ticket=${ticketId}`;
  
  const emailSubject = `🚨 URGENT: Nouveau ticket #${ticketId}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Urgent Ticket</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 2px solid #dc2626;">
    <div style="background: #dc2626; padding: 20px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">🚨 URGENT TICKET</h1>
    </div>
    
    <div style="padding: 24px;">
      <p><strong>Ticket:</strong> #${escapeHtml(ticketId)}</p>
      <p><strong>Sujet:</strong> ${escapeHtml(subject)}</p>
      <p><strong>De:</strong> ${escapeHtml(requesterName)}${garageName ? ` (${escapeHtml(garageName)})` : ''}</p>
      
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message.slice(0, 500))}${message.length > 500 ? '...' : ''}</p>
      </div>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="${adminLink}" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Répondre maintenant →
        </a>
      </div>
      
      <p style="color: #666; font-size: 12px; margin-top: 16px; text-align: center;">
        SLA: Réponse attendue dans les 2 heures
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  if (isTestMode()) {
    addToOutbox({
      to: SUPPORT_EMAIL,
      subject: emailSubject,
      html,
      metadata: { type: "urgent_ticket", ticketId },
    });
    return { success: true };
  }

  const client = getResendClient();
  if (!client) {
    return { success: false, error: "Email service not configured" };
  }

  try {
    await client.emails.send({
      from: getMailFrom(),
      to: SUPPORT_EMAIL,
      subject: emailSubject,
      html,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    trackError(err instanceof Error ? err : new Error(message), {
      area: "email",
      operation: "sendUrgentTicketEmail",
      metadata: { ticketId },
    });
    return { success: false, error: message };
  }
}
