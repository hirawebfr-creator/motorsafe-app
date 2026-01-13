import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanEnv(val: string | undefined): string | undefined {
  return val?.replace(/\\r\\n$/, "").replace(/\r\n$/, "").trim();
}

export async function GET() {
  const raw = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.substring(0, 20) + "...",
    STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
    STRIPE_PRICE_STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    STRIPE_PRICE_STARTER_YEARLY: process.env.STRIPE_PRICE_STARTER_YEARLY,
    APP_URL: process.env.APP_URL,
  };

  const cleaned = {
    STRIPE_SECRET_KEY: cleanEnv(process.env.STRIPE_SECRET_KEY)?.substring(0, 20) + "...",
    STRIPE_PRICE_PRO_MONTHLY: cleanEnv(process.env.STRIPE_PRICE_PRO_MONTHLY),
    STRIPE_PRICE_PRO_YEARLY: cleanEnv(process.env.STRIPE_PRICE_PRO_YEARLY),
    STRIPE_PRICE_STARTER_MONTHLY: cleanEnv(process.env.STRIPE_PRICE_STARTER_MONTHLY),
    STRIPE_PRICE_STARTER_YEARLY: cleanEnv(process.env.STRIPE_PRICE_STARTER_YEARLY),
    APP_URL: cleanEnv(process.env.APP_URL),
  };

  return NextResponse.json({ raw, cleaned });
}
