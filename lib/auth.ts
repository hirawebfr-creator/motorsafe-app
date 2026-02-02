import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "ms_session";
const SESSION_TTL_DAYS_DEFAULT = 1; // 1 jour par défaut
const SESSION_TTL_DAYS_REMEMBER = 30; // 30 jours si "rester connecté"

export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN" | "GARAGE" | "OWNER" | "STAFF" | "PARTNER";
  garageId: number | null;
  garage?: {
    id: number;
    name: string;
    email: string;
    status: "PENDING" | "ACTIVE" | "REJECTED";
    plan?: "FREE" | "STARTER" | "PRO";
    subscriptionStatus?:
      | "INCOMPLETE"
      | "INCOMPLETE_EXPIRED"
      | "TRIALING"
      | "ACTIVE"
      | "PAST_DUE"
      | "CANCELED"
      | "UNPAID";
    currentPeriodEnd?: string | null;
  } | null;
};

function parseCookie(cookieHeader: string | null) {
  if (!cookieHeader) return {} as Record<string, string>;
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {} as Record<string, string>);
}

function getExpiryDate(rememberMe: boolean = false) {
  const days = rememberMe ? SESSION_TTL_DAYS_REMEMBER : SESSION_TTL_DAYS_DEFAULT;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, rememberMe: boolean = false) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = getExpiryDate(rememberMe);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

export function setSessionCookie(res: NextResponse, token: string, expiresAt: Date) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionToken(req?: Request) {
  if (req) {
    const cookie = parseCookie(req.headers.get("cookie"));
    return cookie[SESSION_COOKIE];
  }

  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

async function getSessionByToken(token: string | undefined | null) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          garage: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              plan: true,
              subscriptionStatus: true,
              currentPeriodEnd: true,
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await deleteSession(token);
    return null;
  }

  const user = session.user;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    garageId: user.garageId ?? null,
    garage: user.garage ?? null,
  } as SessionUser;
}

export async function getSessionUser(req?: Request) {
  const token = await getSessionToken(req);
  return getSessionByToken(token);
}

export function isApprovedGarage(user: SessionUser | null) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  // Allow PENDING and ACTIVE garages to use the app
  // Only REJECTED garages are blocked
  return Boolean(user.garage && (user.garage.status === "ACTIVE" || user.garage.status === "PENDING"));
}

export function scopeWhereGarage<T extends { garageId?: number | null }>(
  user: SessionUser
) {
  if (user.role === "ADMIN") return {} as T;
  return { garageId: user.garageId ?? -1 } as T;
}
