"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cancelMyOrder, getMyOrders } from "@/app/actions/orders";
import { Toaster, useToasts } from "@/components/ui/toaster";
import { writeCart } from "@/lib/client-cart";
import { formatChf } from "@/lib/game";
import { isOpenOrder } from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/supabase/database.types";
import { formatDateTimeShort } from "@/lib/time";
import { OrderProgress } from "./order-status";

type Props = { mode: "demo" | "live"; userId: string | null; initialOrders: Order[] };

export function MyOrders({ mode, userId, initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { toasts, push } = useToasts();
  const previous = useRef(new Map(initialOrders.map((o) => [o.id, o.status])));

  // Retour du panier ou de la page de paiement.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("new")) push("Commande envoyée : on s'en occupe !", "xp");
    if (params.has("paid")) {
      writeCart([]);
      push("Paiement reçu, merci ! On prépare ta commande.", "xp");
    }
    if (params.has("new") || params.has("paid")) window.history.replaceState(null, "", "/commandes");
  }, [push]);

  // Temps réel : le staff fait avancer la commande, l'écran suit.
  useEffect(() => {
    if (mode === "demo" || !userId) return;
    const refresh = async () => {
      const result = await getMyOrders();
      if (!result.ok) return;
      for (const o of result.data) {
        const before = previous.current.get(o.id);
        if (before && before !== o.status && o.status === "ready") push(`Commande n° ${o.number} prête au comptoir !`, "xp");
      }
      previous.current = new Map(result.data.map((o) => [o.id, o.status]));
      setOrders(result.data);
    };
    const supabase = createClient();
    const channel = supabase
      .channel(`orders:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` }, refresh)
      .subscribe();
    // Retour sur l'onglet : on rattrape ce qui a pu être manqué.
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mode, userId, push]);

  async function cancel(order: Order) {
    setCancelling(order.id);
    const result = await cancelMyOrder(order.id);
    setCancelling(null);
    if (!result.ok) return push(result.error, "error");
    setOrders((list) => list.map((o) => (o.id === order.id ? result.data : o)));
  }

  if (mode === "demo") {
    return <p className="text-sm text-zinc-400">Mode démo : les commandes s&apos;afficheront ici une fois Supabase branché.</p>;
  }

  const open = orders.filter(isOpenOrder);
  const past = orders.filter((o) => !isOpenOrder(o));

  return (
    <>
      <Toaster toasts={toasts} />
      {orders.length === 0 ? (
        <div className="manga-panel p-6 text-center">
          <p className="font-extrabold text-paper">Aucune commande pour l&apos;instant.</p>
          <Link href="/shop" className="pressable mt-4 inline-block border-2 border-black bg-torii px-4 py-2.5 text-sm font-extrabold text-white shadow-panel">
            Commander au shop
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <section aria-labelledby="open-orders" className="space-y-3">
              <h2 id="open-orders" className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">
                En cours
              </h2>
              {open.map((o) => (
                <OrderCard key={o.id} order={o}>
                  {o.status === "pending" && o.payment_status === "unpaid" && (
                    <button
                      type="button"
                      onClick={() => cancel(o)}
                      disabled={cancelling === o.id}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 underline underline-offset-4 hover:text-paper"
                    >
                      {cancelling === o.id && <Loader2 className="size-3.5 animate-spin" />}
                      Annuler la commande
                    </button>
                  )}
                </OrderCard>
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section aria-labelledby="past-orders" className="space-y-3">
              <h2 id="past-orders" className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">
                Historique
              </h2>
              {past.map((o) => (
                <OrderCard key={o.id} order={o} compact />
              ))}
            </section>
          )}
        </div>
      )}
    </>
  );
}

function OrderCard({ order, compact, children }: { order: Order; compact?: boolean; children?: React.ReactNode }) {
  const ready = order.status === "ready";
  return (
    <article className={`border-2 p-4 ${ready ? "border-gold bg-gold/10" : compact ? "border-zinc-800" : "border-zinc-700 bg-charcoal"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl text-paper">n° {order.number}</h3>
        <span className="font-extrabold tabular-nums text-paper">{formatChf(order.total_chf)} CHF</span>
      </div>
      <p className="mt-0.5 text-xs text-zinc-400">
        {formatDateTimeShort(order.created_at)} · {order.payment_status === "paid" ? "payée" : "à payer au comptoir"}
      </p>
      <p className="mt-2 text-sm text-zinc-300">{order.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</p>
      {ready && <p className="mt-2 font-extrabold text-gold-ink">Ta commande t&apos;attend au comptoir : donne le n° {order.number}.</p>}
      <div className="mt-3">
        <OrderProgress order={order} />
      </div>
      {children}
    </article>
  );
}
