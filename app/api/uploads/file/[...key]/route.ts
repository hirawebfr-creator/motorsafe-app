import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string[] }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { key } = await ctx.params;
  const rel = (key || []).join("/");

  // Only serve from ./uploads
  if (!rel || rel.includes("..")) {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Chemin invalide" } }, { status: 400 });
  }

  const abs = path.join(process.cwd(), "uploads", rel);

  try {
    const buf = await readFile(abs);

    const contentType = rel.endsWith(".pdf") ? "application/pdf" : "application/octet-stream";

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "Fichier introuvable" } }, { status: 404 });
  }
}
