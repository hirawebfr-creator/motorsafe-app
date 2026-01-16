/**
 * Secure File Download Endpoint
 * 
 * GET /api/uploads/file/[...key]
 * 
 * Security:
 * - Auth required
 * - Garage scope enforced: file path must start with uploads/{garageId}/
 * - No cross-tenant access
 */

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getSessionUser, isApprovedGarage } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  // 1. Auth check
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Non authentifié" } },
      { status: 401 }
    );
  }

  if (!isApprovedGarage(user)) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Garage non approuvé" } },
      { status: 403 }
    );
  }

  const garageId = user.garageId;
  if (!garageId && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Garage non associé" } },
      { status: 403 }
    );
  }

  const { key } = await ctx.params;
  const rel = (key || []).join("/");

  // 2. Only serve from ./uploads, no path traversal
  if (!rel || rel.includes("..")) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Chemin invalide" } },
      { status: 400 }
    );
  }

  // 3. CRITICAL: Enforce garage scope on file path
  // Files are stored as: uploads/{garageId}/filename
  // For non-admin users, the path MUST start with their garageId
  if (user.role !== "ADMIN") {
    const expectedPrefix = `${garageId}/`;
    if (!rel.startsWith(expectedPrefix)) {
      // Return 404 (not 403) to avoid information leakage
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Fichier introuvable" } },
        { status: 404 }
      );
    }
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
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Fichier introuvable" } },
      { status: 404 }
    );
  }
}
