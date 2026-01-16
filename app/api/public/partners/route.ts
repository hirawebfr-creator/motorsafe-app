import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSet } from "@/lib/cache";

// ============================================================
// GET /api/public/partners — Public list of partner garages
// ============================================================

// Cache TTL: 5 minutes (partner list changes rarely)
const CACHE_TTL_MS = 5 * 60 * 1000;

type PartnerGarage = {
  id: number;
  displayName: string | null;
  name: string;
  city: string | null;
  postalCode: string | null;
  publicPhone: string | null;
  publicWebsite: string | null;
  logoKey: string | null;
};

async function fetchPartnerGarages(): Promise<PartnerGarage[]> {
  return prisma.garage.findMany({
    where: {
      status: "ACTIVE",
      publicProfileEnabled: true,
      OR: [
        { partnerBadgeAdminOverride: "FORCE_ON" },
        {
          partnerBadgeAdminOverride: { not: "FORCE_OFF" },
          partnerBadgeEnabled: true,
        },
      ],
    },
    select: {
      id: true,
      displayName: true,
      name: true,
      city: true,
      postalCode: true,
      publicPhone: true,
      publicWebsite: true,
      logoKey: true,
    },
    orderBy: { displayName: "asc" },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || "").trim().toLowerCase();
    const dept = (searchParams.get("dept") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    // Fetch all eligible garages with cache (DB query is expensive)
    const garages = await getOrSet("public:partners:list", CACHE_TTL_MS, fetchPartnerGarages);

    // Compute department and filter
    let filtered = garages.map((g) => {
      const pc = g.postalCode || "";
      // French department: first 2 digits, except Corsica (2A, 2B) and DOM-TOM
      let department = pc.substring(0, 2);
      if (pc.startsWith("20")) {
        // Corsica: 20000-20199 = 2A, 20200-20999 = 2B (simplified)
        const num = parseInt(pc, 10);
        department = num < 20200 ? "2A" : "2B";
      } else if (pc.length === 5 && pc.startsWith("97")) {
        // DOM-TOM: 971-976
        department = pc.substring(0, 3);
      }

      return {
        id: g.id,
        name: g.displayName || g.name,
        city: g.city,
        postalCode: g.postalCode,
        department,
        phone: g.publicPhone,
        website: g.publicWebsite,
        logoUrl: g.logoKey ? `/api/uploads/file/${g.logoKey}` : null,
      };
    });

    // Filter by department
    if (dept) {
      filtered = filtered.filter(
        (g) => g.department?.toLowerCase() === dept.toLowerCase()
      );
    }

    // Filter by search query (name, city, postalCode)
    if (query) {
      filtered = filtered.filter((g) => {
        const name = (g.name || "").toLowerCase();
        const city = (g.city || "").toLowerCase();
        const cp = (g.postalCode || "").toLowerCase();
        return name.includes(query) || city.includes(query) || cp.includes(query);
      });
    }

    // Sort alphabetically by name
    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    // Paginate
    const total = filtered.length;
    const data = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      ok: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/public/partners] Error:", err);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
