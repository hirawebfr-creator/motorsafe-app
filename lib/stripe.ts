import Stripe from "stripe";

// Nettoie les \r\n littéraux parfois ajoutés par Vercel CLI
function cleanEnv(val: string | undefined): string | undefined {
  return val?.replace(/\\r\\n$/, "").replace(/\r\n$/, "").trim();
}

export function getStripe() {
  const key = cleanEnv(process.env.STRIPE_SECRET_KEY);
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }

  return new Stripe(key, {
    typescript: true,
  });
}
