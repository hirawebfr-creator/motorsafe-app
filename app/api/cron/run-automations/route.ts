/**
 * AUTOMATIONS-01: Cron runner for automation jobs
 * 
 * Protected by CRON_SECRET header
 * Processes pending jobs: reminders, alerts, digests
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AutomationJobKind, AutomationJobStatus } from "@prisma/client";
import { getNotificationSettings, checkDailyEmailLimit } from "@/lib/automations";
import { getGarageEntitlements } from "@/lib/entitlements";
import { decrypt, decryptClientData } from "@/lib/encryption";
import {
  sendSignatureReminderEmail,
  sendQuoteReminderEmail,
  sendInvoiceReminderEmail,
  sendQuotaAlertEmail,
  sendAppointmentReminderEmail,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Max jobs per run
const BATCH_SIZE = 50;

/**
 * Validate cron secret
 */
function validateCronSecret(req: Request): boolean {
  const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.CRON_SECRET;
  
  if (!expected) {
    console.warn("[Cron] CRON_SECRET not configured");
    return false;
  }
  
  return secret === expected;
}

/**
 * Log system event for automation
 */
async function logSystemEvent(
  type: string,
  service: string,
  status: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.systemEvent.create({
      data: { type, service, status, message, metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined },
    });
  } catch (err) {
    console.error("[Cron] Failed to log system event:", err);
  }
}

export async function POST(req: Request) {
  // Validate cron secret
  if (!validateCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    processed: 0,
    done: 0,
    cancelled: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    // Fetch pending jobs that are due
    const jobs = await prisma.automationJob.findMany({
      where: {
        status: AutomationJobStatus.PENDING,
        runAt: { lte: new Date() },
      },
      orderBy: { runAt: "asc" },
      take: BATCH_SIZE,
    });

    if (jobs.length === 0) {
      return NextResponse.json({ ok: true, message: "No pending jobs", results });
    }

    // Process each job
    for (const job of jobs) {
      results.processed++;

      try {
        // Lock job (set to RUNNING)
        await prisma.automationJob.update({
          where: { id: job.id },
          data: { status: AutomationJobStatus.RUNNING, attempts: { increment: 1 } },
        });

        // Get notification settings for garage
        const settings = await getNotificationSettings(job.garageId);
        
        // Check opt-in based on job kind
        const isEnabled = checkOptIn(job.kind, settings);
        if (!isEnabled) {
          await markJob(job.id, AutomationJobStatus.CANCELLED, "Opt-out");
          results.cancelled++;
          continue;
        }

        // Check daily email limit for reminder jobs
        if (isReminderJob(job.kind)) {
          const emailLimit = await checkDailyEmailLimit(job.garageId);
          if (!emailLimit.allowed) {
            await markJob(job.id, AutomationJobStatus.CANCELLED, "Daily email limit reached");
            results.skipped++;
            continue;
          }
        }

        // Check entitlements
        const entitlements = await getGarageEntitlements(job.garageId);
        if (entitlements.planKey === "FREE" && isReminderJob(job.kind)) {
          await markJob(job.id, AutomationJobStatus.CANCELLED, "Plan does not allow automated emails");
          results.cancelled++;
          continue;
        }

        // Execute job based on kind
        const result = await executeJob(job);
        
        if (result.cancelled) {
          await markJob(job.id, AutomationJobStatus.CANCELLED, result.reason);
          results.cancelled++;
        } else if (result.success) {
          await markJob(job.id, AutomationJobStatus.DONE);
          results.done++;
          
          // Log audit event
          await prisma.auditLog.create({
            data: {
              garageId: job.garageId,
              userId: null,
              action: `AUTOMATION_${job.kind}`,
              entityType: job.targetType.toUpperCase(),
              entityId: job.targetId,
              metadata: { jobId: job.id },
            },
          });
        } else {
          await markJob(job.id, AutomationJobStatus.FAILED, result.error);
          results.failed++;
        }
      } catch (jobErr) {
        console.error(`[Cron] Job ${job.id} failed:`, jobErr);
        await markJob(job.id, AutomationJobStatus.FAILED, String(jobErr));
        results.failed++;
      }
    }

    // Log system event
    await logSystemEvent(
      "automation_run",
      "cron",
      results.failed > 0 ? "degraded" : "ok",
      `Processed ${results.processed} jobs`,
      { ...results, duration: Date.now() - startTime }
    );

    return NextResponse.json({ ok: true, results, duration: Date.now() - startTime });
  } catch (err) {
    console.error("[Cron] Fatal error:", err);
    await logSystemEvent("automation_run", "cron", "down", String(err));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ============================================
// Helper Functions
// ============================================

function isReminderJob(kind: AutomationJobKind): boolean {
  return (
    kind === AutomationJobKind.SIGN_REMINDER ||
    kind === AutomationJobKind.QUOTE_REMINDER ||
    kind === AutomationJobKind.INVOICE_REMINDER
  );
}

function checkOptIn(
  kind: AutomationJobKind,
  settings: { signatureReminders: boolean; quoteReminders: boolean; invoiceReminders: boolean; quotaAlerts: boolean; appointmentsReminders: boolean }
): boolean {
  switch (kind) {
    case AutomationJobKind.SIGN_REMINDER:
      return settings.signatureReminders;
    case AutomationJobKind.QUOTE_REMINDER:
      return settings.quoteReminders;
    case AutomationJobKind.INVOICE_REMINDER:
      return settings.invoiceReminders;
    case AutomationJobKind.QUOTA_ALERT:
      return settings.quotaAlerts;
    case AutomationJobKind.ADMIN_DIGEST:
      return true; // Always enabled for admin
    case AutomationJobKind.APPOINTMENT_REMINDER:
      return settings.appointmentsReminders;
    default:
      return false;
  }
}

async function markJob(jobId: string, status: AutomationJobStatus, error?: string) {
  await prisma.automationJob.update({
    where: { id: jobId },
    data: {
      status,
      lastError: error ? error.substring(0, 500) : null,
    },
  });
}

interface JobResult {
  success: boolean;
  cancelled?: boolean;
  reason?: string;
  error?: string;
}

async function executeJob(job: {
  id: string;
  kind: AutomationJobKind;
  garageId: number;
  targetType: string;
  targetId: string;
}): Promise<JobResult> {
  switch (job.kind) {
    case AutomationJobKind.SIGN_REMINDER:
      return executeSignatureReminder(job.targetId, job.garageId);
    case AutomationJobKind.QUOTE_REMINDER:
      return executeQuoteReminder(job.targetId, job.garageId);
    case AutomationJobKind.INVOICE_REMINDER:
      return executeInvoiceReminder(job.targetId, job.garageId);
    case AutomationJobKind.QUOTA_ALERT:
      return executeQuotaAlert(job.garageId);
    case AutomationJobKind.ADMIN_DIGEST:
      // Admin digest handled separately (weekly cron)
      return { success: true };
    case AutomationJobKind.APPOINTMENT_REMINDER:
      return executeAppointmentReminder(job.targetId, job.garageId);
    default:
      return { success: false, error: "Unknown job kind" };
  }
}

async function executeSignatureReminder(signatureRequestId: string, _garageId: number): Promise<JobResult> {
  // Fetch signature request
  const sig = await prisma.signatureRequest.findUnique({
    where: { id: signatureRequestId },
    include: {
      garage: { select: { name: true, displayName: true, email: true, phone: true } },
    },
  });

  if (!sig) {
    return { cancelled: true, success: false, reason: "Signature request not found" };
  }

  // Check if already signed or expired
  if (sig.status === "SIGNED") {
    return { cancelled: true, success: false, reason: "Already signed" };
  }
  if (sig.status === "EXPIRED" || sig.status === "VOID" || sig.status === "DECLINED") {
    return { cancelled: true, success: false, reason: `Status is ${sig.status}` };
  }
  if (new Date(sig.expiresAt) < new Date()) {
    return { cancelled: true, success: false, reason: "Link expired" };
  }

  // Check if email is available
  if (!sig.signerEmail) {
    return { cancelled: true, success: false, reason: "No signer email" };
  }

  // Check dispute lock on intervention
  if (sig.documentType === "INTERVENTION_ORDER" || sig.documentType === "INTERVENTION_DELIVERY") {
    const intervention = await prisma.intervention.findUnique({
      where: { id: sig.documentId },
      select: { disputeStatus: true },
    });
    if (intervention?.disputeStatus === "OPEN") {
      return { cancelled: true, success: false, reason: "Intervention under dispute" };
    }
  }

  // Build signing URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.motorsafe.fr";
  const signingUrl = `${appUrl}/sign/${sig.token}`;
  const garageName = sig.garage.displayName || sig.garage.name;

  // Send reminder email
  const result = await sendSignatureReminderEmail({
    to: sig.signerEmail,
    signingUrl,
    garageName,
    garagePhone: sig.garage.phone || undefined,
    garageEmail: sig.garage.email || undefined,
    expiresAt: sig.expiresAt,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

async function executeQuoteReminder(quoteId: string, _garageId: number): Promise<JobResult> {
  // Fetch quote
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      organisation: { select: { name: true, displayName: true, email: true, phone: true } },
    },
  });

  if (!quote || quote.deletedAt) {
    return { cancelled: true, success: false, reason: "Quote not found or deleted" };
  }

  // Check if already accepted or rejected
  if (quote.status !== "SENT") {
    return { cancelled: true, success: false, reason: `Status is ${quote.status}` };
  }

  // Decrypt client data
  const client = decryptClientData(quote.client as Record<string, unknown>) as typeof quote.client;
  if (!client.email) {
    return { cancelled: true, success: false, reason: "No client email" };
  }

  // Build download URL (need to create a new token)
  // For simplicity, we'll use a direct link that requires auth
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.motorsafe.fr";
  const garageName = quote.organisation.displayName || quote.organisation.name;

  // Send reminder email
  const result = await sendQuoteReminderEmail({
    to: client.email,
    quoteNumber: quote.quoteNumber || undefined,
    totalTTC: formatEur(quote.totalIncl),
    garageName,
    garagePhone: quote.organisation.phone || undefined,
    garageEmail: quote.organisation.email || undefined,
    appUrl,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

async function executeInvoiceReminder(invoiceId: string, _garageId: number): Promise<JobResult> {
  // Fetch invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      organisation: { select: { name: true, displayName: true, email: true, phone: true } },
    },
  });

  if (!invoice || invoice.deletedAt) {
    return { cancelled: true, success: false, reason: "Invoice not found or deleted" };
  }

  // Check if already paid
  if (invoice.status === "PAID" || invoice.status === "CANCELED") {
    return { cancelled: true, success: false, reason: `Status is ${invoice.status}` };
  }

  // Decrypt client data
  const client = decryptClientData(invoice.client as Record<string, unknown>) as typeof invoice.client;
  if (!client.email) {
    return { cancelled: true, success: false, reason: "No client email" };
  }

  const garageName = invoice.organisation.displayName || invoice.organisation.name;
  const remaining = invoice.totalIncl - invoice.amountPaid;

  // Send reminder email
  const result = await sendInvoiceReminderEmail({
    to: client.email,
    invoiceNumber: invoice.invoiceNumber || undefined,
    totalTTC: formatEur(invoice.totalIncl),
    amountDue: formatEur(remaining),
    dueAt: invoice.dueAt ? new Date(invoice.dueAt) : undefined,
    garageName,
    garagePhone: invoice.organisation.phone || undefined,
    garageEmail: invoice.organisation.email || undefined,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

async function executeQuotaAlert(garageId: number): Promise<JobResult> {
  // Fetch garage
  const garage = await prisma.garage.findUnique({
    where: { id: garageId },
    select: { email: true, name: true, displayName: true },
  });

  if (!garage) {
    return { cancelled: true, success: false, reason: "Garage not found" };
  }

  // Get quota usage
  const { getQuotaUsage } = await import("@/lib/entitlements");
  const lookupUsage = await getQuotaUsage(garageId, "vehicleLookupPerMonth");
  const aiUsage = await getQuotaUsage(garageId, "aiRequestsPerMonth");

  const alerts: string[] = [];
  if (!lookupUsage.unlimited && lookupUsage.used >= lookupUsage.limit * 0.8) {
    const pct = Math.round((lookupUsage.used / lookupUsage.limit) * 100);
    alerts.push(`Recherches véhicule: ${lookupUsage.used}/${lookupUsage.limit} (${pct}%)`);
  }
  if (!aiUsage.unlimited && aiUsage.used >= aiUsage.limit * 0.8) {
    const pct = Math.round((aiUsage.used / aiUsage.limit) * 100);
    alerts.push(`Requêtes IA: ${aiUsage.used}/${aiUsage.limit} (${pct}%)`);
  }

  if (alerts.length === 0) {
    return { cancelled: true, success: false, reason: "No quota alerts needed" };
  }

  // Send quota alert email
  const result = await sendQuotaAlertEmail({
    to: garage.email,
    garageName: garage.displayName || garage.name,
    alerts,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

// APPOINTMENTS-01: Execute appointment reminder
async function executeAppointmentReminder(appointmentId: string, _garageId: number): Promise<JobResult> {
  // Fetch appointment with client and garage info
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      garage: { select: { name: true, displayName: true, email: true, phone: true, address: true } },
    },
  });

  if (!appointment) {
    return { cancelled: true, success: false, reason: "Appointment not found" };
  }

  // Check if still scheduled
  if (appointment.status !== "SCHEDULED") {
    return { cancelled: true, success: false, reason: `Status is ${appointment.status}` };
  }

  // Check if appointment is in the past
  if (new Date(appointment.startAt) < new Date()) {
    return { cancelled: true, success: false, reason: "Appointment already passed" };
  }

  // Decrypt client email if needed
  let clientEmail = appointment.client.email;
  if (clientEmail?.startsWith("enc:")) {
    try {
      clientEmail = decrypt(clientEmail);
    } catch {
      return { cancelled: true, success: false, reason: "Cannot decrypt client email" };
    }
  }

  if (!clientEmail) {
    return { cancelled: true, success: false, reason: "No client email" };
  }

  const garageName = appointment.garage.displayName || appointment.garage.name;

  // Determine if J-1 or H-2 reminder
  const hoursUntil = (new Date(appointment.startAt).getTime() - Date.now()) / (1000 * 60 * 60);
  const reminderType = hoursUntil > 6 ? "J1" : "H2";

  // Update appointment with reminder sent timestamp
  if (reminderType === "J1") {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSentJ1At: new Date() },
    });
  } else {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSentH2At: new Date() },
    });
  }

  // Send reminder email
  const result = await sendAppointmentReminderEmail({
    to: clientEmail,
    clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
    garageName,
    garagePhone: appointment.garage.phone || undefined,
    garageAddress: appointment.garage.address || undefined,
    appointmentTitle: appointment.title,
    appointmentDate: new Date(appointment.startAt),
    reminderType,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
