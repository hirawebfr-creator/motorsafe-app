/**
 * SUPPORT-SLA-01: System Incidents Status API
 * GET /api/incidents/status
 * 
 * Returns public-facing service status based on SystemEvent logs.
 * No PII, no sensitive data - just service health status.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ServiceStatus = "OK" | "DELAYED" | "DOWN" | "UNKNOWN";

interface ServiceInfo {
  status: ServiceStatus;
  lastCheck: string | null;
  message: string;
}

interface IncidentsStatusResponse {
  overall: ServiceStatus;
  services: {
    stripe: ServiceInfo;
    email: ServiceInfo;
    storage: ServiceInfo;
    lookup: ServiceInfo;
  };
  lastUpdated: string;
}

// Thresholds (in milliseconds)
const DELAYED_THRESHOLD_MS = 6 * 60 * 60 * 1000;  // 6 hours
const DOWN_THRESHOLD_MS = 24 * 60 * 60 * 1000;    // 24 hours

/**
 * Determine status based on last event time
 */
function getStatusFromLastSeen(lastSeenAt: Date | null, now: Date): ServiceStatus {
  if (!lastSeenAt) return "UNKNOWN";
  
  const ageMs = now.getTime() - lastSeenAt.getTime();
  
  if (ageMs > DOWN_THRESHOLD_MS) return "DOWN";
  if (ageMs > DELAYED_THRESHOLD_MS) return "DELAYED";
  return "OK";
}

/**
 * Get status message
 */
function getStatusMessage(status: ServiceStatus, serviceName: string): string {
  switch (status) {
    case "OK":
      return `${serviceName} fonctionne normalement`;
    case "DELAYED":
      return `${serviceName} peut avoir des délais`;
    case "DOWN":
      return `${serviceName} est peut-être indisponible`;
    case "UNKNOWN":
      return `Pas de données récentes pour ${serviceName}`;
  }
}

export async function GET(req: Request) {
  try {
    // Auth required - garage users only
    const user = await requireUser(req);
    requireApprovedTenant(user);

    const now = new Date();

    // Query last successful events for each service
    const [stripeEvent, emailEvent, storageEvent, lookupEvent] = await Promise.all([
      // Stripe: look for webhook events or payment events
      prisma.systemEvent.findFirst({
        where: {
          service: "stripe",
          status: "ok",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      // Email: look for email service events
      prisma.systemEvent.findFirst({
        where: {
          service: "email",
          status: "ok",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      // Storage: look for storage events
      prisma.systemEvent.findFirst({
        where: {
          service: "storage",
          status: "ok",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      // AI/Lookup: look for AI events
      prisma.systemEvent.findFirst({
        where: {
          service: "ai",
          status: "ok",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    // Check for any "down" events in last hour (indicates active issue)
    const recentDownEvents = await prisma.systemEvent.findMany({
      where: {
        status: "down",
        createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
      },
      select: { service: true },
    });

    const downServices = new Set(recentDownEvents.map(e => e.service));

    // Build service statuses
    const stripeStatus = downServices.has("stripe") 
      ? "DOWN" 
      : getStatusFromLastSeen(stripeEvent?.createdAt ?? null, now);
    
    const emailStatus = downServices.has("email")
      ? "DOWN"
      : getStatusFromLastSeen(emailEvent?.createdAt ?? null, now);
    
    const storageStatus = downServices.has("storage")
      ? "DOWN"
      : getStatusFromLastSeen(storageEvent?.createdAt ?? null, now);
    
    const lookupStatus = downServices.has("ai")
      ? "DOWN"
      : getStatusFromLastSeen(lookupEvent?.createdAt ?? null, now);

    // Calculate overall status
    const statuses = [stripeStatus, emailStatus, storageStatus, lookupStatus];
    let overall: ServiceStatus = "OK";
    if (statuses.some(s => s === "DOWN")) {
      overall = "DOWN";
    } else if (statuses.some(s => s === "DELAYED")) {
      overall = "DELAYED";
    } else if (statuses.every(s => s === "UNKNOWN")) {
      overall = "UNKNOWN";
    }

    const response: IncidentsStatusResponse = {
      overall,
      services: {
        stripe: {
          status: stripeStatus,
          lastCheck: stripeEvent?.createdAt?.toISOString() ?? null,
          message: getStatusMessage(stripeStatus, "Paiements"),
        },
        email: {
          status: emailStatus,
          lastCheck: emailEvent?.createdAt?.toISOString() ?? null,
          message: getStatusMessage(emailStatus, "Emails"),
        },
        storage: {
          status: storageStatus,
          lastCheck: storageEvent?.createdAt?.toISOString() ?? null,
          message: getStatusMessage(storageStatus, "Stockage"),
        },
        lookup: {
          status: lookupStatus,
          lastCheck: lookupEvent?.createdAt?.toISOString() ?? null,
          message: getStatusMessage(lookupStatus, "Recherche véhicule"),
        },
      },
      lastUpdated: now.toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    return toErrorResponse(err);
  }
}
