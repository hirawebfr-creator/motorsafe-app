/**
 * APPOINTMENTS-01: Appointment helper functions
 * 
 * Handles reminder job creation and cancellation
 */

import { prisma } from "@/lib/prisma";
import { AutomationJobKind, AutomationJobStatus } from "@prisma/client";

// ============================================
// Reminder Job Creation
// ============================================

/**
 * Create reminder jobs for an appointment with STANDARD policy
 * Creates 2 jobs: J-1 (24h before) and H-2 (2h before)
 */
export async function createAppointmentReminderJobs(
  garageId: number,
  appointmentId: string,
  startAt: Date
): Promise<void> {
  const jobs = [
    { suffix: "J1", offsetMs: 24 * 60 * 60 * 1000 }, // 24 hours before
    { suffix: "H2", offsetMs: 2 * 60 * 60 * 1000 },  // 2 hours before
  ];

  for (const { suffix, offsetMs } of jobs) {
    const runAt = new Date(startAt.getTime() - offsetMs);
    
    // Skip if runAt is in the past
    if (runAt <= new Date()) {
      continue;
    }

    const dedupKey = `appt:${appointmentId}:${suffix}`;

    await prisma.automationJob.upsert({
      where: { dedupKey },
      create: {
        kind: AutomationJobKind.APPOINTMENT_REMINDER,
        garageId,
        targetType: "appointment",
        targetId: appointmentId,
        runAt,
        dedupKey,
      },
      update: {
        runAt,
        status: AutomationJobStatus.PENDING,
      },
    });
  }
}

// ============================================
// Reminder Job Cancellation
// ============================================

/**
 * Cancel all pending reminder jobs for an appointment
 */
export async function cancelAppointmentReminderJobs(
  appointmentId: string
): Promise<void> {
  await prisma.automationJob.updateMany({
    where: {
      targetType: "appointment",
      targetId: appointmentId,
      status: AutomationJobStatus.PENDING,
    },
    data: {
      status: AutomationJobStatus.CANCELLED,
    },
  });
}

// ============================================
// Check if reminders are enabled for garage
// ============================================

/**
 * Check if appointment reminders are enabled for a garage
 */
export async function areAppointmentRemindersEnabled(
  garageId: number
): Promise<boolean> {
  const settings = await prisma.garageNotificationSettings.findUnique({
    where: { garageId },
    select: { appointmentsReminders: true },
  });
  
  // Default to true if no settings exist
  return settings?.appointmentsReminders ?? true;
}
