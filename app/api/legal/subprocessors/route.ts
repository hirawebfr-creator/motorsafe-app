import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/legal/subprocessors
 * Public list of active subprocessors for GDPR transparency
 */
export async function GET() {
  try {
    const subprocessors = await prisma.subprocessor.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        purpose: true,
        region: true,
        linkUrl: true,
      },
    });

    return NextResponse.json({ ok: true, data: subprocessors });
  } catch (error) {
    console.error("[legal/subprocessors] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch subprocessors" },
      { status: 500 }
    );
  }
}
