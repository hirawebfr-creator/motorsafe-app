/**
 * WHITE-LABEL-PARTNERS-01: Garage Logo Upload
 * 
 * POST /api/garages/branding/logo - Upload logo (presign + save)
 * DELETE /api/garages/branding/logo - Remove logo
 * 
 * Security:
 * - PNG only (safest format for MVP)
 * - Max 1MB
 * - Scoped by garageId
 * - Requires BRANDING feature
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { requireFeature, FeatureKey } from "@/lib/entitlements";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// === ALLOWED MIME TYPES ===
// PNG only for MVP (safest, no script injection risk)
const ALLOWED_MIMES = ["image/png"];
const MAX_SIZE = 1 * 1024 * 1024; // 1MB

const PresignSchema = z.object({
  fileName: z.string().trim().min(1).max(100),
  mime: z.string().refine((m) => ALLOWED_MIMES.includes(m), {
    message: "Format non supporté. Utilisez PNG uniquement.",
  }),
  size: z.coerce.number().int().min(1).max(MAX_SIZE, {
    message: `Taille max: ${MAX_SIZE / 1024 / 1024}MB`,
  }),
});

// ============================================
// POST /api/garages/branding/logo
// Returns presigned URL + saves logoKey on success
// ============================================

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    if (!user.garageId) throw new RouteError(400, "TENANT_REQUIRED", "Garage requis");

    // Check feature entitlement
    await requireFeature(user.garageId, FeatureKey.BRANDING);

    const json = await req.json().catch(() => null);
    const parsed = PresignSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        failure("Données invalides", parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { fileName, mime } = parsed.data;
    const garageId = user.garageId;

    // Generate unique key scoped to garage
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 50);
    const key = `branding/${garageId}/logo-${Date.now()}-${sanitizedName}`;

    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;

    let strategy: "s3" | "local" = "local";
    let uploadUrl = "/api/uploads/local";
    let method = "POST";
    let headers: Record<string, string> = {};

    if (bucket && region) {
      // S3 presigned URL
      const client = new S3Client({
        region,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
      });

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: mime,
      });

      uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });
      strategy = "s3";
      method = "PUT";
      headers = { "Content-Type": mime };
    }

    // Save logoKey to garage (will be overwritten on each upload)
    await prisma.garage.update({
      where: { id: garageId },
      data: { logoKey: key },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "GARAGE_LOGO_UPLOADED",
        entityType: "Garage",
        entityId: String(garageId),
        metadata: { key, strategy },
      },
    });

    return NextResponse.json(
      success({
        strategy,
        method,
        url: uploadUrl,
        headers,
        key,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}

// ============================================
// DELETE /api/garages/branding/logo
// Remove logo from garage
// ============================================

export async function DELETE(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    if (!user.garageId) throw new RouteError(400, "TENANT_REQUIRED", "Garage requis");

    const garage = await prisma.garage.findUnique({
      where: { id: user.garageId },
      select: { logoKey: true },
    });

    if (!garage?.logoKey) {
      return NextResponse.json(failure("Aucun logo à supprimer"), { status: 404 });
    }

    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;

    // Try to delete from S3 if configured
    if (bucket && region) {
      try {
        const client = new S3Client({
          region,
          endpoint: process.env.S3_ENDPOINT || undefined,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
        });

        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: garage.logoKey,
          })
        );
      } catch (s3Err) {
        console.warn("Failed to delete logo from S3:", s3Err);
        // Continue anyway - clear DB reference
      }
    }

    // Clear logoKey
    await prisma.garage.update({
      where: { id: user.garageId },
      data: { logoKey: null },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: user.garageId,
        userId: user.id,
        action: "GARAGE_LOGO_DELETED",
        entityType: "Garage",
        entityId: String(user.garageId),
      },
    });

    return NextResponse.json(success({ deleted: true }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
