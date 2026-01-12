import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  let dbError = null;
  if (process.env.DATABASE_URL) {
    try {
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (e) {
      dbError = (e as Error).message;
    }
  }
  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    db: process.env.DATABASE_URL ? { ok: dbOk, error: dbError } : undefined,
  });
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    // quick ping to Prisma
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(success(true));
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json(failure("db-error"), { status: 500 });
  }
}
