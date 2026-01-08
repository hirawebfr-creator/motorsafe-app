import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { success } from "@/lib/api";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { toErrorResponse } from "@/lib/routeErrors";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  key: z.string().trim().min(1).max(400),
  mime: z.string().trim().min(1).max(120),
  contentBase64: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    if (user.role === "ADMIN") {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Tenant requis" } }, { status: 400 });
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Body invalide", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { key, mime, contentBase64 } = parsed.data;

    if (key.includes("..")) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Key invalide" } }, { status: 400 });
    }

    // Force tenant-scoped key prefix.
    const expectedPrefix = `uploads/${user.garageId}/`;
    if (!key.startsWith(expectedPrefix)) {
      return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Key hors-tenant" } }, { status: 403 });
    }

    const buf = Buffer.from(contentBase64, "base64");
    const max = 20 * 1024 * 1024;
    if (buf.length > max) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Fichier trop grand" } }, { status: 400 });
    }

    const abs = path.join(process.cwd(), "uploads", key);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, buf);

    const fileUrl = `/api/uploads/file/${key}`;

    return NextResponse.json(success({ key, fileUrl, mime, size: buf.length }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
