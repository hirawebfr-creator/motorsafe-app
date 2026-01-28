/**
 * API: Generate export package from intervention
 * POST /api/documents/exports/generate
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantIdWithAdminOverride } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const garageId = getTenantIdWithAdminOverride(user, req);

    if (!garageId) {
      throw new RouteError(400, "TENANT_REQUIRED", "Garage requis pour générer un export");
    }

    const body = await req.json().catch(() => null);
    
    if (!body || !body.interventionId) {
      throw new RouteError(400, "BAD_REQUEST", "interventionId requis");
    }

    const { interventionId } = body;

    // Get intervention with all related data
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: {
        vehicle: {
          include: {
            client: true,
          },
        },
        garage: true,
        evidenceItems: {
          orderBy: { createdAt: "asc" },
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!intervention) {
      throw new RouteError(404, "NOT_FOUND", "Intervention non trouvée");
    }

    if (user.role !== "ADMIN" && intervention.garageId !== garageId) {
      throw new RouteError(403, "FORBIDDEN", "Accès refusé");
    }

    // Create a document entry for the export
    const now = new Date();
    const exportFileName = `export_${intervention.id}_${now.toISOString().split('T')[0]}.zip`;

    const exportDoc = await prisma.document.create({
      data: {
        garageId,
        vehicleId: intervention.vehicleId,
        interventionId: intervention.id,
        type: "INTERVENTION_REPORT",
        category: "DIVERS",
        fileName: exportFileName,
        fileUrl: "", // Will be filled when actual file is generated
        mime: "application/zip",
        size: 0,
      },
    });

    // Return summary of what would be in the export
    return NextResponse.json(success({
      export: {
        id: exportDoc.id,
        fileName: exportFileName,
        intervention: {
          id: intervention.id,
          status: intervention.status,
          notes: intervention.notes,
        },
        vehicle: intervention.vehicle ? {
          id: intervention.vehicle.id,
          plate: intervention.vehicle.plate,
          brand: intervention.vehicle.brand,
          model: intervention.vehicle.model,
        } : null,
        client: intervention.vehicle?.client ? {
          id: intervention.vehicle.client.id,
          name: `${intervention.vehicle.client.firstName} ${intervention.vehicle.client.lastName}`,
        } : null,
        evidenceCount: intervention.evidenceItems.length,
        documentCount: intervention.documents.length,
      },
      message: "Export généré avec succès",
    }), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
