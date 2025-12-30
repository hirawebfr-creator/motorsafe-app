import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({ orderBy: { id: "desc" } });
    return NextResponse.json(success(clients));
  } catch (err) {
    console.error("Erreur API GET /api/clients :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();

    if (!firstName || !lastName) {
      return NextResponse.json(failure("Prénom et nom obligatoires."), { status: 400 });
    }

    const client = await prisma.client.create({ data: { firstName, lastName } });
    return NextResponse.json(success(client), { status: 201 });
  } catch (err) {
    console.error("Erreur API POST /api/clients :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
