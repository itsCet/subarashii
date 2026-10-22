import type Stripe from "stripe";
import { isOnlinePaymentEnabled, stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe → Developers → Webhooks → endpoint `https://<site>/api/stripe/webhook`,
// événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
// `checkout.session.async_payment_failed` et `checkout.session.expired`.
export async function POST(request: Request) {
  if (!isOnlinePaymentEnabled) return new Response("Paiement en ligne désactivé", { status: 404 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Signature manquante", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;
  if (!event.type.startsWith("checkout.session.") || !orderId) return Response.json({ received: true });

  const supabase = createAdminClient();
  const paid =
    event.type === "checkout.session.async_payment_succeeded" ||
    (event.type === "checkout.session.completed" && session.payment_status === "paid");
  const failed = event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed";

  // Les deux fonctions sont idempotentes : Stripe peut renvoyer un même événement.
  const { error } = paid
    ? await supabase.rpc("mark_order_paid", { p_order_id: orderId, p_session_id: session.id })
    : failed
      ? await supabase.rpc("expire_online_order", { p_order_id: orderId })
      : { error: null };

  if (error) {
    console.error(`[stripe] ${event.type} pour la commande ${orderId} :`, error);
    return new Response("Erreur base de données", { status: 500 }); // Stripe réessaiera
  }
  return Response.json({ received: true });
}
