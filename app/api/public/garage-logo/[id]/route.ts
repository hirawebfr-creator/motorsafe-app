/**
 * WHITE-LABEL-PARTNERS-01: Public Garage Logo
 * 
 * GET /api/public/garage-logo/[id] - Serve logo for public partner garages
 * 
 * Security:
 * - Only serves logos for garages with publicProfileEnabled=true
 * - OR partner badge active
 * - Returns 404 for private garages (no leak of existence)
 * - Cache headers for performance
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPartnerBadgeActive } from "@/lib/pdf/partnerBadge";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const garageId = parseInt(id, 10);

    if (Number.isNaN(garageId)) {
      return new NextResponse(null, { status: 404 });
    }

    // Fetch garage with minimal fields
    const garage = await prisma.garage.findUnique({
      where: { id: garageId },
      select: {
        logoKey: true,
        publicProfileEnabled: true,
        partnerBadgeEnabled: true,
        partnerBadgeAdminOverride: true,
        status: true,
      },
    });

    // Security: only serve if public or partner
    if (!garage) {
      return new NextResponse(null, { status: 404 });
    }

    if (garage.status !== "ACTIVE") {
      return new NextResponse(null, { status: 404 });
    }

    const isPublicOrPartner = garage.publicProfileEnabled || isPartnerBadgeActive(garage);
    if (!isPublicOrPartner) {
      return new NextResponse(null, { status: 404 });
    }

    if (!garage.logoKey) {
      return new NextResponse(null, { status: 404 });
    }

    // Fetch logo from storage
    let logoBuffer: Buffer | null = null;
    let contentType = "image/png";

    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;

    if (bucket && region) {
      // S3/R2
      try {
        const client = new S3Client({
          region,
          endpoint: process.env.S3_ENDPOINT || undefined,
          forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
        });

        const response = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: garage.logoKey,
          })
        );

        if (response.Body) {
          const chunks: Uint8Array[] = [];
          const stream = response.Body as AsyncIterable<Uint8Array>;
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          logoBuffer = Buffer.concat(chunks);
          contentType = response.ContentType || "image/png";
        }
      } catch (s3Err) {
        console.warn("Failed to fetch logo from S3:", s3Err);
      }
    } else {
      // Local storage fallback
      try {
        const localPath = join(process.cwd(), "uploads", garage.logoKey);
        if (existsSync(localPath)) {
          logoBuffer = readFileSync(localPath);
        }
      } catch (localErr) {
        console.warn("Failed to fetch logo from local:", localErr);
      }
    }

    if (!logoBuffer) {
      return new NextResponse(null, { status: 404 });
    }

    // Return with cache headers (1 hour public cache)
    return new NextResponse(new Uint8Array(logoBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Error serving garage logo:", err);
    return new NextResponse(null, { status: 500 });
  }
}
