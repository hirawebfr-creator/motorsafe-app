import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    // quick ping to Prisma
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json({ ok: false, error: "db-error" }, { status: 500 });
  }
}
