import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getDemoGarage, canAccessDemoMode, enableDemoMode, disableDemoMode } from "@/lib/demo";

/**
 * DEMO-SCENARIO-01: Demo Mode Toggle Endpoint
 * 
 * POST /api/admin/demo/toggle
 * body: { enabled: boolean }
 * 
 * Enable/disable demo mode for the current user.
 * Protected: admin/owner only
 */

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Get demo garage first
    const demoGarage = await getDemoGarage();
    if (!demoGarage) {
      return NextResponse.json(
        { error: "Garage démo introuvable" },
        { status: 404 }
      );
    }

    // Check demo access
    if (!canAccessDemoMode(sessionUser, demoGarage)) {
      return NextResponse.json(
        { error: "Accès refusé - admin ou propriétaire requis" },
        { status: 403 }
      );
    }

    const { enabled } = await req.json();

    if (enabled) {
      await enableDemoMode(sessionUser.id);
    } else {
      await disableDemoMode(sessionUser.id);
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        garageId: demoGarage.id,
        userId: sessionUser.id,
        action: enabled ? "DEMO_ENABLED" : "DEMO_DISABLED",
        entityType: "USER",
        entityId: sessionUser.id,
        metadata: { enabled },
      },
    });

    return NextResponse.json({
      success: true,
      enabled,
      message: enabled ? "Mode démo activé" : "Mode démo désactivé",
      demoGarage: {
        id: demoGarage.id,
        name: demoGarage.name,
        slug: demoGarage.slug,
      },
    });
  } catch (error) {
    console.error("[DEMO_TOGGLE] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors du changement de mode" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/demo/toggle
 * 
 * Get current demo mode status for the user
 */
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Get demo garage first
    const demoGarage = await getDemoGarage();

    // Check demo access
    const hasAccess = canAccessDemoMode(sessionUser, demoGarage);
    if (!hasAccess) {
      return NextResponse.json({
        canAccess: false,
        enabled: false,
        demoGarage: null,
      });
    }

    // Get user's demo mode status
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { demoModeEnabledAt: true },
    });

    const enabled = user?.demoModeEnabledAt !== null;

    return NextResponse.json({
      canAccess: true,
      enabled,
      demoGarage: demoGarage ? {
        id: demoGarage.id,
        name: demoGarage.name,
        slug: demoGarage.slug,
      } : null,
    });
  } catch (error) {
    console.error("[DEMO_STATUS] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du statut" },
      { status: 500 }
    );
  }
}
