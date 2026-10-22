import "server-only";
import Stripe from "stripe";

// Paiement en ligne (carte, TWINT…) : actif seulement si les trois clés sont présentes.
// Les moyens de paiement proposés se règlent dans le Dashboard Stripe (Settings → Payment methods).
export const isOnlinePaymentEnabled = Boolean(
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

let client: Stripe | null = null;
export function stripe() {
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  return client;
}
