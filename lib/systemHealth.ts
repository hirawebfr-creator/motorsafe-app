/**
 * System Health Checks
 * Admin-only health monitoring - no PII/client data exposed
 */
import { prisma } from "@/lib/prisma";

export type ServiceName = "db" | "stripe" | "email" | "ai" | "storage" | "system";
export type ServiceStatus = "ok" | "degraded" | "down";

export interface ServiceHealth {
  service: ServiceName;
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

export interface SystemHealthResult {
  overall: ServiceStatus;
  services: ServiceHealth[];
  checkedAt: string;
  env: {
    nodeEnv: string;
    vercelEnv?: string;
  };
  metrics: {
    totalGarages: number;
    activeSubscriptions: number;
    pendingApprovals: number;
  };
}

// Check if environment variables are configured (not their values)
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isAIConfigured(): boolean {
  const provider = process.env.AI_PROVIDER || "mock";
  if (provider === "mock") return true;
  return Boolean(process.env.AI_API_KEY);
}

export function isStorageConfigured(): boolean {
  // Using local storage by default, S3 optional
  return true;
}

// Individual service health checks
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      service: "db",
      status: "ok",
      latencyMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      service: "db",
      status: "down",
      latencyMs: Date.now() - start,
      message: "Database connection failed",
      checkedAt: new Date().toISOString(),
    };
  }
}

async function checkStripe(): Promise<ServiceHealth> {
  if (!isStripeConfigured()) {
    return {
      service: "stripe",
      status: "degraded",
      message: "Not configured",
      checkedAt: new Date().toISOString(),
    };
  }

  const start = Date.now();
  try {
    // Just check we can init the client - no actual API call needed for health
    const { getStripe } = await import("@/lib/stripe");
    getStripe(); // This throws if key is invalid format
    return {
      service: "stripe",
      status: "ok",
      latencyMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      service: "stripe",
      status: "down",
      latencyMs: Date.now() - start,
      message: "Stripe initialization failed",
      checkedAt: new Date().toISOString(),
    };
  }
}

async function checkEmail(): Promise<ServiceHealth> {
  if (!isEmailConfigured()) {
    return {
      service: "email",
      status: "degraded",
      message: "Not configured",
      checkedAt: new Date().toISOString(),
    };
  }

  // Can't really ping Resend without sending an email
  // Just verify config is present
  return {
    service: "email",
    status: "ok",
    message: "Configured",
    checkedAt: new Date().toISOString(),
  };
}

async function checkAI(): Promise<ServiceHealth> {
  const provider = process.env.AI_PROVIDER || "mock";
  
  if (provider === "mock") {
    return {
      service: "ai",
      status: "ok",
      message: "Mock provider",
      checkedAt: new Date().toISOString(),
    };
  }

  if (!isAIConfigured()) {
    return {
      service: "ai",
      status: "degraded",
      message: "Not configured",
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    service: "ai",
    status: "ok",
    message: `Provider: ${provider}`,
    checkedAt: new Date().toISOString(),
  };
}

async function checkStorage(): Promise<ServiceHealth> {
  // Local storage is always available
  // Could add S3 check here if configured
  return {
    service: "storage",
    status: "ok",
    message: "Local storage",
    checkedAt: new Date().toISOString(),
  };
}

// Get anonymous metrics (counts only, no PII)
async function getMetrics(): Promise<SystemHealthResult["metrics"]> {
  try {
    const [totalGarages, activeSubscriptions, pendingApprovals] = await Promise.all([
      prisma.garage.count(),
      prisma.garage.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.garage.count({ where: { status: "PENDING" } }),
    ]);
    return { totalGarages, activeSubscriptions, pendingApprovals };
  } catch {
    return { totalGarages: 0, activeSubscriptions: 0, pendingApprovals: 0 };
  }
}

// Main health check function
export async function checkSystemHealth(): Promise<SystemHealthResult> {
  const [db, stripe, email, ai, storage, metrics] = await Promise.all([
    checkDatabase(),
    checkStripe(),
    checkEmail(),
    checkAI(),
    checkStorage(),
    getMetrics(),
  ]);

  const services = [db, stripe, email, ai, storage];
  
  // Overall status: down if any critical (db) is down, degraded if any is degraded
  let overall: ServiceStatus = "ok";
  if (db.status === "down") {
    overall = "down";
  } else if (services.some(s => s.status === "down")) {
    overall = "degraded";
  } else if (services.some(s => s.status === "degraded")) {
    overall = "degraded";
  }

  return {
    overall,
    services,
    checkedAt: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || "unknown",
      vercelEnv: process.env.VERCEL_ENV,
    },
    metrics,
  };
}

// Log a system event (for alerting history)
export async function logSystemEvent(
  type: "health_check" | "alert" | "recovery" | "startup",
  service: ServiceName,
  status: ServiceStatus,
  message?: string,
  metadata?: object
): Promise<void> {
  try {
    await prisma.systemEvent.create({
      data: {
        type,
        service,
        status,
        message,
        metadata: metadata as never ?? undefined,
      },
    });
  } catch {
    // Don't throw - logging failures shouldn't break the app
    console.error("[SystemEvent] Failed to log event", { type, service, status });
  }
}

// Get recent system events (for admin dashboard)
export async function getRecentEvents(limit = 50): Promise<{
  id: string;
  type: string;
  service: string;
  status: string;
  message: string | null;
  createdAt: Date;
}[]> {
  return prisma.systemEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      service: true,
      status: true,
      message: true,
      createdAt: true,
    },
  });
}
