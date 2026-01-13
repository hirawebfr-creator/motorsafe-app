import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }

  return new Stripe(key, {
    typescript: true,
  });
}
