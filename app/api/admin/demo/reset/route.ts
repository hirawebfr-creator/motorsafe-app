import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getDemoGarage, canAccessDemoMode } from "@/lib/demo";

/**
 * DEMO-SCENARIO-01: Reset Demo Endpoint
 * 
 * POST /api/admin/demo/reset
 * 
 * Resets demo garage data:
 * - Reset signatures to SENT
 * - Reset invoices to unpaid (DRAFT)
 * - Reset quotes to pending (DRAFT)
 * - Clear demo progress state
 * - Log audit event
 * 
 * Protected: admin/owner only + demo garage required
 */

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
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
    if (!canAccessDemoMode(user, demoGarage)) {
      return NextResponse.json(
        { error: "Accès refusé - admin ou propriétaire requis" },
        { status: 403 }
      );
    }

    // Reset all signature requests to DRAFT
    const signaturesReset = await prisma.signatureRequest.updateMany({
      where: {
        garageId: demoGarage.id,
      },
      data: {
        status: "DRAFT",
        signedAt: null,
        signedPdfUrl: null,
        signedPdfHash: null,
        signedPdfKey: null,
      },
    });

    // Reset all quotes to DRAFT
    const quotesReset = await prisma.quote.updateMany({
      where: {
        organisationId: demoGarage.id,
      },
      data: {
        status: "DRAFT",
      },
    });

    // Reset all invoices to DRAFT and unpaid
    const invoicesReset = await prisma.invoice.updateMany({
      where: {
        organisationId: demoGarage.id,
      },
      data: {
        status: "DRAFT",
        paidAt: null,
      },
    });

    // Reset intervention statuses to OPEN
    const interventionsReset = await prisma.intervention.updateMany({
      where: {
        garageId: demoGarage.id,
      },
      data: {
        status: "OPEN",
      },
    });

    // Clear demo state for all users
    await prisma.demoState.deleteMany({
      where: {
        garageId: demoGarage.id,
      },
    });

    // Increment demo seed version
    await prisma.garage.update({
      where: { id: demoGarage.id },
      data: {
        demoSeedVersion: (demoGarage.demoSeedVersion || 0) + 1,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        garageId: demoGarage.id,
        userId: user.id,
        action: "DEMO_RESET",
        entityType: "GARAGE",
        entityId: String(demoGarage.id),
        metadata: {
          signaturesReset: signaturesReset.count,
          quotesReset: quotesReset.count,
          invoicesReset: invoicesReset.count,
          interventionsReset: interventionsReset.count,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Données démo réinitialisées",
      stats: {
        signatures: signaturesReset.count,
        quotes: quotesReset.count,
        invoices: invoicesReset.count,
        interventions: interventionsReset.count,
      },
    });
  } catch (error) {
    console.error("[DEMO_RESET] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation" },
      { status: 500 }
    );
  }
}
