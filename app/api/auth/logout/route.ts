import { NextResponse } from "next/server";
import { success, failure } from "@/lib/api";
import { clearSessionCookie, deleteSession, getSessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const token = getSessionToken(req);
    if (token) await deleteSession(token);

    const res = NextResponse.json(success(true));
    clearSessionCookie(res);
    return res;
  } catch (err) {
    console.error("Erreur API POST /api/auth/logout :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
