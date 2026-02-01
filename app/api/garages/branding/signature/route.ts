/**
 * EVIDENCE-CAPTURE-01: Garage Signature Upload
 *
 * POST /api/garages/branding/signature - Upload signature (presign + save)
 * DELETE /api/garages/branding/signature - Remove signature
 *
 * Security:
 * - PNG only (transparent background support)
 * - Max 500KB
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
// PNG only for transparent backgrounds
const ALLOWED_MIMES = ["image/png"];
const MAX_SIZE = 500 * 1024; // 500KB

const PresignSchema = z.object({
  fileName: z.string().trim().min(1).max(100),
  mime: z.string().refine((m) => ALLOWED_MIMES.includes(m), {
    message: "Format non supporté. Utilisez PNG uniquement.",
  }),
  size: z.coerce.number().int().min(1).max(MAX_SIZE, {
    message: `Taille max: ${MAX_SIZE / 1024}KB`,
  }),
});

// ============================================
// POST /api/garages/branding/signature
// Returns presigned URL + saves signatureImageKey on success
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
    const key = `branding/${garageId}/signature-${Date.now()}-${sanitizedName}`;

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

    // Save signatureImageKey to garage
    await prisma.garage.update({
      where: { id: garageId },
      data: { signatureImageKey: key },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "GARAGE_SIGNATURE_UPLOADED",
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
// DELETE /api/garages/branding/signature
// Remove signature from garage
// ============================================

export async function DELETE(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    if (!user.garageId) throw new RouteError(400, "TENANT_REQUIRED", "Garage requis");

    const garage = await prisma.garage.findUnique({
      where: { id: user.garageId },
      select: { signatureImageKey: true },
    });

    if (!garage?.signatureImageKey) {
      return NextResponse.json(failure("Aucune signature à supprimer"), { status: 404 });
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
            Key: garage.signatureImageKey,
          })
        );
      } catch (s3Err) {
        console.warn("Failed to delete signature from S3:", s3Err);
        // Continue anyway - clear DB reference
      }
    }

    // Clear signatureImageKey
    await prisma.garage.update({
      where: { id: user.garageId },
      data: { signatureImageKey: null },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId: user.garageId,
        userId: user.id,
        action: "GARAGE_SIGNATURE_DELETED",
        entityType: "Garage",
        entityId: String(user.garageId),
      },
    });

    return NextResponse.json(success({ deleted: true }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
