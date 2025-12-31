import { NextResponse } from "next/server";
import { success, failure } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorise"), { status: 401 });
    return NextResponse.json(success({ user }));
  } catch (err) {
    console.error("Erreur API GET /api/auth/me :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
