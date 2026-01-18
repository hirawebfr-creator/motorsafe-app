import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, failure } from "@/lib/api";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

// Generate a unique referral code (SAFE-XXXX)
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars (0/O, 1/I/L)
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SAFE-${code}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const garageName = normalizeText(body.garageName);
    const garageEmail = normalizeEmail(body.garageEmail);
    const phone = body.phone ? normalizeText(body.phone) : null;
    const address = body.address ? normalizeText(body.address) : null;
    const siret = body.siret ? normalizeText(body.siret) : null;
    const referralCodeInput = body.referralCode ? normalizeText(body.referralCode).toUpperCase() : null;
    // PARTNER-PROGRAM-01: Partner ref code (external affiliates)
    const partnerRefInput = body.partnerRef ? normalizeText(body.partnerRef).toUpperCase() : null;

    const userEmail = normalizeEmail(body.email);
    const password = String(body.password ?? "");

    if (!garageName || !garageEmail || !userEmail || !password) {
      return NextResponse.json(failure("Tous les champs obligatoires doivent etre remplis."), {
        status: 400,
      });
    }

    if (garageName.length < 2 || garageName.length > 120) {
      return NextResponse.json(failure("Nom de garage invalide."), { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(failure("Mot de passe trop court (8 caracteres minimum)."), {
        status: 400,
      });
    }

    const existingGarage = await prisma.garage.findUnique({
      where: { email: garageEmail },
      select: { id: true },
    });
    if (existingGarage) {
      return NextResponse.json(failure("Un garage avec cet email existe deja."), { status: 409 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (existingUser) {
      return NextResponse.json(failure("Cet email est deja utilise."), { status: 409 });
    }

    // Check referral code if provided (garage-to-garage)
    let referrerGarage: { id: number } | null = null;
    if (referralCodeInput) {
      referrerGarage = await prisma.garage.findUnique({
        where: { referralCode: referralCodeInput },
        select: { id: true },
      });
      // Silently ignore invalid codes (don't block registration)
    }

    // PARTNER-PROGRAM-01: Check external partner ref code
    let partner: { id: number } | null = null;
    if (partnerRefInput) {
      partner = await prisma.partner.findFirst({
        where: { refCode: partnerRefInput, isActive: true },
        select: { id: true },
      });
      // Silently ignore invalid partner codes
    }

    const passwordHash = await hashPassword(password);

    // Generate unique referral code for new garage
    let referralCode: string;
    let attempts = 0;
    do {
      referralCode = generateReferralCode();
      const existing = await prisma.garage.findUnique({
        where: { referralCode },
        select: { id: true },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const garage = await prisma.$transaction(async (tx) => {
      const createdGarage = await tx.garage.create({
        data: {
          name: garageName,
          email: garageEmail,
          phone,
          address,
          siret,
          status: "PENDING",
          referralCode,
          referredByGarageId: referrerGarage?.id ?? null,
          referralStatus: referrerGarage ? "PENDING" : "NONE",
        },
      });

      await tx.user.create({
        data: {
          email: userEmail,
          passwordHash,
          role: "OWNER",
          garageId: createdGarage.id,
        },
      });

      // Log referral event if applicable (garage-to-garage)
      if (referrerGarage) {
        await tx.referralEvent.create({
          data: {
            referrerGarageId: referrerGarage.id,
            refereeGarageId: createdGarage.id,
            eventType: "REF_APPLIED",
          },
        });
      }

      // PARTNER-PROGRAM-01: Create partner attribution if applicable
      if (partner) {
        await tx.partnerAttribution.create({
          data: {
            partnerId: partner.id,
            garageId: createdGarage.id,
            source: "REF_LINK",
            refCodeUsed: partnerRefInput,
          },
        });
      }

      return createdGarage;
    });

    return NextResponse.json(
      success({
        garageId: garage.id,
        message: "Demande recue. Votre compte sera valide apres verification.",
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("Erreur API POST /api/auth/register-pro :", err);
    return NextResponse.json(failure("Erreur serveur"), { status: 500 });
  }
}
