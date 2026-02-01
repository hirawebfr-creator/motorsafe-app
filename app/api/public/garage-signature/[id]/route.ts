/**
 * EVIDENCE-CAPTURE-01: Public Garage Signature
 *
 * GET /api/public/garage-signature/[id] - Serve signature for PDFs
 *
 * Security:
 * - Only serves signatures for active garages
 * - Returns 404 if no signature or garage not found
 * - Cache headers for performance
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        signatureImageKey: true,
        status: true,
      },
    });

    // Security check
    if (!garage) {
      return new NextResponse(null, { status: 404 });
    }

    if (garage.status !== "ACTIVE") {
      return new NextResponse(null, { status: 404 });
    }

    if (!garage.signatureImageKey) {
      return new NextResponse(null, { status: 404 });
    }

    // Fetch signature from storage
    let signatureBuffer: Buffer | null = null;
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
            Key: garage.signatureImageKey,
          })
        );

        if (response.Body) {
          const chunks: Uint8Array[] = [];
          const stream = response.Body as AsyncIterable<Uint8Array>;
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          signatureBuffer = Buffer.concat(chunks);
          contentType = response.ContentType || "image/png";
        }
      } catch (s3Err) {
        console.warn("Failed to fetch signature from S3:", s3Err);
      }
    } else {
      // Local storage fallback
      try {
        const localPath = join(process.cwd(), "uploads", garage.signatureImageKey);
        if (existsSync(localPath)) {
          signatureBuffer = readFileSync(localPath);
        }
      } catch (localErr) {
        console.warn("Failed to fetch signature from local:", localErr);
      }
    }

    if (!signatureBuffer) {
      return new NextResponse(null, { status: 404 });
    }

    // Return with cache headers (1 hour public cache)
    return new NextResponse(new Uint8Array(signatureBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Error serving garage signature:", err);
    return new NextResponse(null, { status: 500 });
  }
}
