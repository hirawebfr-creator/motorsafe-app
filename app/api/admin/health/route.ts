/**
 * Admin Health Check Endpoint
 * GET /api/admin/health
 * 
 * Returns detailed system health status for admin monitoring.
 * Requires admin access (ADMIN role or x-admin-key header).
 * 
 * NO PII or client data is exposed - only anonymous metrics.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import {
  checkSystemHealth,
  logSystemEvent,
  getRecentEvents,
} from "@/lib/systemHealth";

export async function GET(req: NextRequest) {
  // Verify admin access
  const user = await getSessionUser(req);
  if (!hasAdminAccess(user, req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Run health checks
    const health = await checkSystemHealth();

    // Log the health check event
    await logSystemEvent(
      "health_check",
      "system",
      health.overall,
      `Overall: ${health.overall}`,
      {
        services: health.services.reduce((acc, s) => {
          acc[s.service] = s.status;
          return acc;
        }, {} as Record<string, string>),
      }
    );

    // Get recent events
    const recentEvents = await getRecentEvents(20);

    return NextResponse.json({
      ...health,
      recentEvents,
    });
  } catch (error) {
    console.error("[Admin Health] Error:", error);
    return NextResponse.json(
      { error: "Health check failed" },
      { status: 500 }
    );
  }
}
