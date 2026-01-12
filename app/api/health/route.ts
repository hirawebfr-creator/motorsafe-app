// ...existing code...
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
