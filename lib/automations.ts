/**
 * AUTOMATIONS-01: Automation helpers for reminders and alerts
 * 
 * Handles:
 * - Signature reminders (J+1, J+3)
 * - Quote reminders (J+2, J+7)
 * - Invoice reminders (J+7, J+14)
 * - Quota alerts (80%, 100%)
 * - Admin digest (weekly)
 */

import { prisma } from "@/lib/prisma";
import { AutomationJobKind, AutomationJobStatus } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface CreateJobParams {
  kind: AutomationJobKind;
  garageId: number;
  targetType: string;
  targetId: string;
  runAt: Date;
  dedupKey?: string;
}

// ============================================
// Job Creation Helpers
// ============================================

/**
 * Create reminder jobs for a signature request
 * Creates 2 jobs: +1 day and +3 days
 */
export async function createSignatureReminderJobs(
  garageId: number,
  signatureRequestId: string,
  sentAt: Date = new Date()
): Promise<void> {
  const jobs = [
    { days: 1 },
    { days: 3 },
  ];

  for (const { days } of jobs) {
    const runAt = new Date(sentAt);
    runAt.setDate(runAt.getDate() + days);
    
    // Use dedupKey to prevent duplicate jobs
    const dedupKey = `sign:${signatureRequestId}:day${days}`;
    
    await prisma.automationJob.upsert({
      where: { dedupKey },
      create: {
        kind: AutomationJobKind.SIGN_REMINDER,
        garageId,
        targetType: "signature_request",
        targetId: signatureRequestId,
        runAt,
        dedupKey,
      },
      update: {}, // No update if exists
    });
  }
}

/**
 * Create reminder jobs for a quote
 * Creates 2 jobs: +2 days and +7 days
 */
export async function createQuoteReminderJobs(
  garageId: number,
  quoteId: string,
  sentAt: Date = new Date()
): Promise<void> {
  const jobs = [
    { days: 2 },
    { days: 7 },
  ];

  for (const { days } of jobs) {
    const runAt = new Date(sentAt);
    runAt.setDate(runAt.getDate() + days);
    
    const dedupKey = `quote:${quoteId}:day${days}`;
    
    await prisma.automationJob.upsert({
      where: { dedupKey },
      create: {
        kind: AutomationJobKind.QUOTE_REMINDER,
        garageId,
        targetType: "quote",
        targetId: quoteId,
        runAt,
        dedupKey,
      },
      update: {},
    });
  }
}

/**
 * Create reminder jobs for an invoice
 * Creates 2 jobs: +7 days and +14 days
 */
export async function createInvoiceReminderJobs(
  garageId: number,
  invoiceId: string,
  issuedAt: Date = new Date()
): Promise<void> {
  const jobs = [
    { days: 7 },
    { days: 14 },
  ];

  for (const { days } of jobs) {
    const runAt = new Date(issuedAt);
    runAt.setDate(runAt.getDate() + days);
    
    const dedupKey = `invoice:${invoiceId}:day${days}`;
    
    await prisma.automationJob.upsert({
      where: { dedupKey },
      create: {
        kind: AutomationJobKind.INVOICE_REMINDER,
        garageId,
        targetType: "invoice",
        targetId: invoiceId,
        runAt,
        dedupKey,
      },
      update: {},
    });
  }
}

/**
 * Create quota alert job (immediate, deduplicated per month)
 */
export async function createQuotaAlertJob(
  garageId: number,
  quotaType: string,
  threshold: number, // 80 or 100
  monthKey: string // e.g., "2026-01"
): Promise<void> {
  const dedupKey = `quota:${garageId}:${quotaType}:${threshold}:${monthKey}`;
  
  await prisma.automationJob.upsert({
    where: { dedupKey },
    create: {
      kind: AutomationJobKind.QUOTA_ALERT,
      garageId,
      targetType: "garage",
      targetId: String(garageId),
      runAt: new Date(), // Immediate
      dedupKey,
    },
    update: {},
  });
}

// ============================================
// Job Cancellation
// ============================================

/**
 * Cancel pending jobs for a target (e.g., when signature is signed)
 */
export async function cancelPendingJobs(
  targetType: string,
  targetId: string,
  kind?: AutomationJobKind
): Promise<number> {
  const where: {
    targetType: string;
    targetId: string;
    status: AutomationJobStatus;
    kind?: AutomationJobKind;
  } = {
    targetType,
    targetId,
    status: AutomationJobStatus.PENDING,
  };
  
  if (kind) {
    where.kind = kind;
  }
  
  const result = await prisma.automationJob.updateMany({
    where,
    data: { status: AutomationJobStatus.CANCELLED },
  });
  
  return result.count;
}

// ============================================
// Notification Settings
// ============================================

/**
 * Get or create notification settings for a garage
 */
export async function getNotificationSettings(garageId: number) {
  let settings = await prisma.garageNotificationSettings.findUnique({
    where: { garageId },
  });
  
  if (!settings) {
    settings = await prisma.garageNotificationSettings.create({
      data: { garageId },
    });
  }
  
  return settings;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  garageId: number,
  data: {
    signatureReminders?: boolean;
    quoteReminders?: boolean;
    invoiceReminders?: boolean;
    quotaAlerts?: boolean;
    appointmentsReminders?: boolean;
    dailyEmailLimit?: number;
  }
) {
  return prisma.garageNotificationSettings.upsert({
    where: { garageId },
    create: { garageId, ...data },
    update: data,
  });
}

// ============================================
// Daily Email Rate Limit
// ============================================

/**
 * Check if garage can send more automated emails today
 * Uses rate limit bucket with 24h window
 */
export async function checkDailyEmailLimit(garageId: number): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const settings = await getNotificationSettings(garageId);
  const limit = settings.dailyEmailLimit;
  
  // Count jobs done today for this garage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const used = await prisma.automationJob.count({
    where: {
      garageId,
      status: AutomationJobStatus.DONE,
      updatedAt: { gte: today },
      kind: { in: [
        AutomationJobKind.SIGN_REMINDER,
        AutomationJobKind.QUOTE_REMINDER,
        AutomationJobKind.INVOICE_REMINDER,
      ]},
    },
  });
  
  return {
    allowed: used < limit,
    used,
    limit,
  };
}
