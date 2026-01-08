import { NextResponse } from "next/server";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse, RouteError } from "@/lib/routeErrors";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(120),
  size: z.coerce.number().int().min(0).max(20 * 1024 * 1024),
});

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    if (user.role === "ADMIN") throw new RouteError(400, "BAD_REQUEST", "Tenant requis");
    if (!user.garageId) throw new RouteError(400, "TENANT_REQUIRED", "Garage invalide");

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { fileName, mime } = parsed.data;

    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;

    // If S3/R2 is configured, return a presigned PUT URL.
    if (bucket && region) {
      const client = new S3Client({
        region,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "1",
      });

      const key = `uploads/${user.garageId}/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: mime,
      });

      const url = await getSignedUrl(client, command, { expiresIn: 60 * 10 });

      // fileUrl depends on your bucket/public access; we return the key so the app can store it.
      return NextResponse.json(
        success({
          strategy: "s3",
          method: "PUT",
          url,
          headers: { "Content-Type": mime },
          key,
        })
      );
    }

    // Dev local fallback.
    const key = `uploads/${user.garageId}/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;
    return NextResponse.json(
      success({
        strategy: "local",
        method: "POST",
        url: "/api/uploads/local",
        key,
        mime,
      })
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
