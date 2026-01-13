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
    STRIPE_PRICE_STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    APP_URL: process.env.APP_URL,
  };

  const cleaned = {
    STRIPE_SECRET_KEY: cleanEnv(process.env.STRIPE_SECRET_KEY)?.substring(0, 20) + "...",
    STRIPE_PRICE_PRO_MONTHLY: cleanEnv(process.env.STRIPE_PRICE_PRO_MONTHLY),
    STRIPE_PRICE_STARTER_MONTHLY: cleanEnv(process.env.STRIPE_PRICE_STARTER_MONTHLY),
    APP_URL: cleanEnv(process.env.APP_URL),
  };

  const lengths = {
    STRIPE_SECRET_KEY_raw: process.env.STRIPE_SECRET_KEY?.length,
    STRIPE_SECRET_KEY_cleaned: cleanEnv(process.env.STRIPE_SECRET_KEY)?.length,
    STRIPE_PRICE_PRO_MONTHLY_raw: process.env.STRIPE_PRICE_PRO_MONTHLY?.length,
    STRIPE_PRICE_PRO_MONTHLY_cleaned: cleanEnv(process.env.STRIPE_PRICE_PRO_MONTHLY)?.length,
  };

  return NextResponse.json({ raw, cleaned, lengths });
}
