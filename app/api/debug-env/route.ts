import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.APIPLAQUE_TOKEN;
  
  return NextResponse.json({
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPrefix: token ? token.substring(0, 4) + "..." : null,
    nodeEnv: process.env.NODE_ENV,
  });
}
