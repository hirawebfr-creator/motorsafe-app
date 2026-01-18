/**
 * LEADS-CRM-01: Templates API
 * 
 * GET /api/admin/leads/templates - Get all sales templates
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin";
import { success, failure } from "@/lib/api";
import { SALES_TEMPLATES, getTemplatesByChannel } from "@/content/salesTemplates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json(failure("Non autorisé"), { status: 401 });
    if (!hasAdminAccess(user, req)) {
      return NextResponse.json(failure("Accès réservé à l'administration."), { status: 403 });
    }

    const url = new URL(req.url);
    const channel = url.searchParams.get("channel") as "DM" | "SMS" | "EMAIL" | null;

    const templates = channel ? getTemplatesByChannel(channel) : SALES_TEMPLATES;

    return NextResponse.json(success(templates));
  } catch (error) {
    console.error("[Leads API] GET templates error:", error);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
