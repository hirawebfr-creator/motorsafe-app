/**
 * Notifications Service
 * 
 * Helper pour créer des notifications in-app
 * Types: intervention, signature, quote, invoice, system, billing
 */

import { prisma } from "@/lib/prisma";

export type NotificationType = 
  | "intervention_created"
  | "intervention_completed"
  | "signature_requested"
  | "signature_completed"
  | "signature_expired"
  | "quote_accepted"
  | "quote_rejected"
  | "invoice_paid"
  | "invoice_overdue"
  | "client_created"
  | "vehicle_created"
  | "appointment_reminder"
  | "siv_quota_low"
  | "storage_quota_low"
  | "subscription_expiring"
  | "system";

interface CreateNotificationParams {
  garageId: number;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Crée une notification in-app
 */
export async function createNotification(params: CreateNotificationParams): Promise<string> {
  const { garageId, userId, type, title, message, actionUrl, metadata } = params;

  // Format content as JSON for structured data
  const content = JSON.stringify({
    title,
    message,
    actionUrl,
    metadata,
  });

  const notification = await prisma.notification.create({
    data: {
      garageId,
      userId,
      type,
      content,
    },
  });

  return notification.id;
}

/**
 * Crée plusieurs notifications (batch)
 */
export async function createNotifications(
  notifications: CreateNotificationParams[]
): Promise<number> {
  const data = notifications.map((n) => ({
    garageId: n.garageId,
    userId: n.userId,
    type: n.type,
    content: JSON.stringify({
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl,
      metadata: n.metadata,
    }),
  }));

  const result = await prisma.notification.createMany({ data });
  return result.count;
}

/**
 * Parse le contenu d'une notification
 */
export function parseNotificationContent(content: string): {
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
} {
  try {
    return JSON.parse(content);
  } catch {
    // Legacy format: plain text
    return {
      title: "Notification",
      message: content,
    };
  }
}

/**
 * Compte les notifications non lues
 */
export async function getUnreadCount(garageId: number): Promise<number> {
  return prisma.notification.count({
    where: {
      garageId,
      readAt: null,
    },
  });
}

// ============================================
// Helpers pour créer des notifications typées
// ============================================

export async function notifyInterventionCreated(
  garageId: number,
  interventionId: string,
  vehiclePlate: string
): Promise<string> {
  return createNotification({
    garageId,
    type: "intervention_created",
    title: "Nouvelle intervention",
    message: `Intervention créée pour le véhicule ${vehiclePlate}`,
    actionUrl: `/interventions/${interventionId}`,
  });
}

export async function notifyInterventionCompleted(
  garageId: number,
  interventionId: string,
  vehiclePlate: string
): Promise<string> {
  return createNotification({
    garageId,
    type: "intervention_completed",
    title: "Intervention terminée",
    message: `L'intervention sur ${vehiclePlate} est terminée`,
    actionUrl: `/interventions/${interventionId}`,
  });
}

export async function notifySignatureCompleted(
  garageId: number,
  documentType: string,
  clientName: string
): Promise<string> {
  return createNotification({
    garageId,
    type: "signature_completed",
    title: "Signature reçue",
    message: `${clientName} a signé ${documentType}`,
    actionUrl: "/documents",
  });
}

export async function notifyQuoteAccepted(
  garageId: number,
  quoteId: string,
  quoteNumber: string,
  clientName: string
): Promise<string> {
  return createNotification({
    garageId,
    type: "quote_accepted",
    title: "Devis accepté 🎉",
    message: `${clientName} a accepté le devis ${quoteNumber}`,
    actionUrl: `/devis/${quoteId}`,
  });
}

export async function notifyInvoicePaid(
  garageId: number,
  invoiceId: string,
  invoiceNumber: string,
  amount: number
): Promise<string> {
  return createNotification({
    garageId,
    type: "invoice_paid",
    title: "Paiement reçu 💰",
    message: `Facture ${invoiceNumber} payée (${amount.toFixed(2)} €)`,
    actionUrl: `/factures/${invoiceId}`,
  });
}

export async function notifyQuotaLow(
  garageId: number,
  quotaType: "siv" | "storage",
  remaining: number,
  total: number
): Promise<string> {
  const label = quotaType === "siv" ? "recherches SIV" : "stockage";
  const percent = Math.round((remaining / total) * 100);
  
  return createNotification({
    garageId,
    type: quotaType === "siv" ? "siv_quota_low" : "storage_quota_low",
    title: `Quota ${label} bas`,
    message: `Il vous reste ${remaining} ${label} (${percent}%)`,
    actionUrl: "/billing",
  });
}

export async function notifySystem(
  garageId: number,
  title: string,
  message: string,
  actionUrl?: string
): Promise<string> {
  return createNotification({
    garageId,
    type: "system",
    title,
    message,
    actionUrl,
  });
}
