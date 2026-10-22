"use server";

import type { CartLine } from "@/lib/cart";
import { cartToItems } from "@/lib/cart";
import { headers } from "next/headers";
import { normalizeOrder } from "@/lib/orders";
import { isOnlinePaymentEnabled, stripe } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Order, PaymentMethod } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./battle-pass";
import type { TransactionReceipt } from "./staff";

const DEMO = { ok: false, error: "Mode démo : Supabase non configuré." } as const;

const ERRORS: Record<string, string> = {
  FORBIDDEN: "Accès réservé au personnel.",
  NOT_AUTHENTICATED: "Connecte-toi pour commander.",
  SELF_TRANSACTION: "Impossible de créditer ton propre compte.",
  EMPTY_ORDER: "Le panier est vide.",
  TOO_MANY_ITEMS: "Trop d'articles différents dans une seule commande.",
  INVALID_QUANTITY: "Quantité invalide.",
  INVALID_AMOUNT: "Montant invalide.",
  PRODUCT_NOT_FOUND: "Un article n'est plus disponible.",
  OUT_OF_STOCK: "Stock insuffisant",
  TOO_MANY_OPEN_ORDERS: "Tu as déjà 3 commandes en cours : attends qu'elles soient remises.",
  ORDER_NOT_FOUND: "Commande introuvable.",
  ORDER_LOCKED: "Cette commande ne peut plus être modifiée.",
  NOT_PAID: "Commande en ligne pas encore payée.",
  MEMBER_NOT_FOUND: "Membre introuvable.",
};

function toError(error: { message: string; details?: string | null }) {
  const base = ERRORS[error.message] ?? "Une erreur est survenue. Réessaie.";
  // Pour un stock insuffisant, la base précise l'article concerné.
  return error.message === "OUT_OF_STOCK" && error.details ? `${base} : ${error.details}.` : base;
}

type CheckoutResult = { order: Order; receipt: TransactionReceipt | null };

function normalizeCheckout(data: unknown): CheckoutResult {
  const r = data as { order: Order; receipt: TransactionReceipt | null };
  return {
    order: normalizeOrder(r.order),
    receipt: r.receipt
      ? { ...r.receipt, amount_chf: Number(r.receipt.amount_chf), current_season_spent: Number(r.receipt.current_season_spent) }
      : null,
  };
}

// -----------------------------------------------------------------------------
// Caisse staff
// -----------------------------------------------------------------------------

export async function posCheckout(memberId: string | null, cart: CartLine[]): Promise<ActionResult<CheckoutResult>> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pos_checkout", { p_user_id: memberId, p_items: cartToItems(cart) });
  if (error) return { ok: false, error: toError(error) };
  return { ok: true, data: normalizeCheckout(data) };
}

export async function getOpenOrders(): Promise<ActionResult<Order[]>> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_orders", { p_scope: "open" });
  if (error) return { ok: false, error: toError(error) };
  return { ok: true, data: ((data ?? []) as unknown as Order[]).map(normalizeOrder) };
}

export async function setOrderStatus(orderId: string, status: "preparing" | "ready" | "cancelled"): Promise<ActionResult<Order>> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_order_status", { p_order_id: orderId, p_status: status });
  if (error) return { ok: false, error: toError(error) };
  return { ok: true, data: normalizeOrder(data as unknown as Order) };
}

export async function completeOrder(orderId: string): Promise<ActionResult<CheckoutResult>> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_order", { p_order_id: orderId });
  if (error) return { ok: false, error: toError(error) };
  return { ok: true, data: normalizeCheckout(data) };
}

// -----------------------------------------------------------------------------
// Client
// -----------------------------------------------------------------------------

export async function placeOrder(cart: CartLine[], note: string, paymentMethod: PaymentMethod): Promise<ActionResult<Order>> {
  if (!isSupabaseConfigured) return DEMO;
  // Côté client, seules les lignes du catalogue sont acceptées (la base le vérifie aussi).
  if (cart.some((l) => !l.productId)) return { ok: false, error: ERRORS.PRODUCT_NOT_FOUND };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_items: cartToItems(cart),
    p_note: note,
    p_payment_method: paymentMethod,
  });
  if (error) return { ok: false, error: toError(error) };
  return { ok: true, data: normalizeOrder(data as unknown as Order) };
}

export async function getMyOrders(): Promise<ActionResult<Order[]>> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_orders", { p_scope: "mine" });
  if (error) return { ok: false, error: toError(error) };
  return { ok: true, data: ((data ?? []) as unknown as Order[]).map(normalizeOrder) };
}

export async function cancelMyOrder(orderId: string): Promise<ActionResult<Order>> {
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_my_order", { p_order_id: orderId });
  if (error) return { ok: false, error: toError(error) };
  return { ok: true, data: normalizeOrder(data as unknown as Order) };
}

/**
 * Paiement en ligne : la commande est créée (stock réservé), puis le client part sur la page
 * Stripe Checkout. Le webhook `/api/stripe/webhook` la marque payée, ou l'annule si la session expire.
 */
export async function startOnlinePayment(cart: CartLine[], note: string): Promise<ActionResult<{ url: string }>> {
  if (!isSupabaseConfigured) return DEMO;
  if (!isOnlinePaymentEnabled) return { ok: false, error: "Le paiement en ligne n'est pas encore activé." };

  const placed = await placeOrder(cart, note, "online");
  if (!placed.ok) return placed;
  const order = placed.data;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      currency: "chf",
      line_items: order.items.map((i) => ({
        quantity: i.quantity,
        price_data: { currency: "chf", unit_amount: Math.round(i.unit_price_chf * 100), product_data: { name: i.name } },
      })),
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      payment_intent_data: { metadata: { order_id: order.id } },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // le stock réservé est libéré après 30 min
      success_url: `${origin}/commandes?paid=${order.id}`,
      cancel_url: `${origin}/shop/panier?cancelled=${order.id}`,
    });
    if (!session.url) throw new Error("Session Stripe sans URL");
    return { ok: true, data: { url: session.url } };
  } catch (error) {
    console.error("[stripe] création de session impossible :", error);
    // Libère le stock réservé : la commande n'a jamais pu être payée.
    await cancelMyOrder(order.id);
    return { ok: false, error: "Le paiement en ligne est indisponible. Tu peux payer au comptoir." };
  }
}
