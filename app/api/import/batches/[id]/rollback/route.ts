/**
 * POST /api/import/batches/[id]/rollback
 * IMPORT-ONBOARDING-01: Rollback an import batch
 * 
 * Deletes all entities created by this batch.
 * Updates batch status to ROLLED_BACK.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser, getTenantId } from "@/lib/guards";
import { toErrorResponse, badRequest, notFound } from "@/lib/routeErrors";
import { requirePermission, Permission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: batchId } = await params;
    const garageId = getTenantId(user);
    
    // Get batch
    const batch = await prisma.importBatch.findFirst({
      where: user.role === "ADMIN" 
        ? { id: batchId } 
        : { id: batchId, garageId },
    });
    
    if (!batch) {
      throw notFound("Batch d'import introuvable");
    }
    
    if (batch.status !== "IMPORTED") {
      throw badRequest("INVALID_STATUS", "Ce batch ne peut pas être annulé (statut: " + batch.status + ")");
    }
    
    // Check permission based on kind
    const permission = batch.kind === "CLIENTS" ? Permission.CLIENTS_DELETE : Permission.VEHICLES_DELETE;
    await requirePermission(user, permission);
    
    // Get created IDs
    const createdIdsRaw = String(batch.createdIdsJson || "[]");
    const createdIds: (string | number)[] = JSON.parse(createdIdsRaw);
    
    if (createdIds.length === 0) {
      // Nothing to rollback
      await prisma.importBatch.update({
        where: { id: batchId },
        data: { status: "ROLLED_BACK", updatedAt: new Date() },
      });
      
      return NextResponse.json(success({ deletedCount: 0 }));
    }
    
    // Delete entities in transaction
    let deletedCount = 0;
    
    await prisma.$transaction(async (tx) => {
      if (batch.kind === "CLIENTS") {
        // Soft delete clients - IDs are numbers
        const numericIds = createdIds.map((id) => typeof id === "number" ? id : parseInt(String(id), 10));
        const result = await tx.client.updateMany({
          where: {
            id: { in: numericIds },
            garageId: batch.garageId,
          },
          data: { deletedAt: new Date() },
        });
        deletedCount = result.count;
      } else if (batch.kind === "VEHICULES") {
        // Soft delete vehicles - IDs are strings
        const stringIds = createdIds.map((id) => String(id));
        const result = await tx.vehicle.updateMany({
          where: {
            id: { in: stringIds },
            garageId: batch.garageId,
          },
          data: { deletedAt: new Date() },
        });
        deletedCount = result.count;
      }
      
      // Update batch status
      await tx.importBatch.update({
        where: { id: batchId },
        data: {
          status: "ROLLED_BACK",
          updatedAt: new Date(),
        },
      });
    });
    
    return NextResponse.json(
      success({
        batchId,
        deletedCount,
        totalTracked: createdIds.length,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
