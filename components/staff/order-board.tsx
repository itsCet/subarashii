"use client";

import { Bell, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { completeOrder, getOpenOrders, setOrderStatus } from "@/app/actions/orders";
import type { TransactionReceipt } from "@/app/actions/staff";
import { OrderProgress } from "@/components/orders/order-status";
import { Toaster, useToasts } from "@/components/ui/toaster";
import { formatChf, formatXp } from "@/lib/game";
import { ORDER_STATUS_LABEL, isOpenOrder } from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/supabase/database.types";
import { formatDateTimeShort } from "@/lib/time";
import { primaryButton, secondaryButton } from "./form";

type Props = { mode: "demo" | "live"; initialOrders: Order[] };

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: "pending", title: "À préparer" },
  { status: "preparing", title: "En préparation" },
  { status: "ready", title: "Prêtes au comptoir" },
];

export function OrderBoard({ mode, initialOrders }: Props) {
  const demo = mode === "demo";
  const [orders, setOrders] = useState(initialOrders);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toasts, push } = useToasts();
  const known = useRef(new Set(initialOrders.map((o) => o.id)));

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const result = await getOpenOrders();
    setRefreshing(false);
    if (!result.ok) return push(result.error, "error");
    const fresh = result.data.filter((o) => !known.current.has(o.id) && o.status === "pending");
    if (fresh.length > 0) {
      push(fresh.length === 1 ? `Nouvelle commande n° ${fresh[0].number}` : `${fresh.length} nouvelles commandes`, "xp");
      ping();
    }
    known.current = new Set(result.data.map((o) => o.id));
    setOrders(result.data);
  }, [push]);

  // Temps réel : toute commande créée ou modifiée recharge le tableau.
  useEffect(() => {
    if (demo) return;
    const supabase = createClient();
    const channel = supabase
      .channel("staff-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refresh())
      .subscribe();
    // Filet de sécurité si la connexion temps réel décroche (tablette en veille…).
    const interval = setInterval(refresh, 60_000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [demo, refresh]);

  async function advance(order: Order, status: "preparing" | "ready" | "cancelled") {
    if (status === "cancelled" && !confirm(`Annuler la commande n° ${order.number} ? Le stock sera remis en rayon.`)) return;
    setBusy(order.id);
    const result = await setOrderStatus(order.id, status);
    setBusy(null);
    if (!result.ok) return push(result.error, "error");
    setOrders((list) => list.map((o) => (o.id === order.id ? result.data : o)));
  }

  async function complete(order: Order) {
    setBusy(order.id);
    const result = await completeOrder(order.id);
    setBusy(null);
    if (!result.ok) return push(result.error, "error");
    setOrders((list) => list.map((o) => (o.id === order.id ? result.data.order : o)));
    push(receiptMessage(order, result.data.receipt), "xp");
  }

  if (demo) {
    return <p className="text-sm text-zinc-400">Mode démo : les commandes passées depuis le shop apparaîtront ici en direct.</p>;
  }

  const open = orders.filter(isOpenOrder);
  const done = orders.filter((o) => !isOpenOrder(o));

  return (
    <div>
      <Toaster toasts={toasts} />
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          <Bell className="size-4" /> Les nouvelles commandes arrivent ici en direct. Garde cette page ouverte.
        </p>
        <button type="button" onClick={refresh} disabled={refreshing} aria-label="Actualiser" className={secondaryButton}>
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {open.length === 0 && <p className="manga-panel mb-6 p-6 text-center font-bold text-zinc-400">Aucune commande en cours.</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = open.filter((o) => o.status === col.status);
          if (list.length === 0 && open.length === 0) return null;
          return (
            <section key={col.status} aria-labelledby={`col-${col.status}`}>
              <h2 id={`col-${col.status}`} className="mb-2 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
                {col.title} · {list.length}
              </h2>
              <ul className="space-y-3">
                {list.map((o) => (
                  <li key={o.id}>
                    <StaffOrderCard order={o} busy={busy === o.id}>
                      {o.status === "pending" && (
                        <button type="button" onClick={() => advance(o, "preparing")} className={`${primaryButton} flex-1`}>
                          Préparer
                        </button>
                      )}
                      {o.status === "preparing" && (
                        <button type="button" onClick={() => advance(o, "ready")} className={`${primaryButton} flex-1`}>
                          C&apos;est prêt
                        </button>
                      )}
                      {o.status === "ready" && (
                        <button type="button" onClick={() => complete(o)} className={`${primaryButton} flex-1`}>
                          {o.payment_status === "paid" ? "Remise au client" : `Encaisser ${formatChf(o.total_chf)} CHF`}
                        </button>
                      )}
                      <button type="button" onClick={() => advance(o, "cancelled")} className={secondaryButton}>
                        Annuler
                      </button>
                    </StaffOrderCard>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {done.length > 0 && (
        <section aria-labelledby="done-orders" className="mt-10">
          <h2 id="done-orders" className="mb-2 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
            Terminées (2 dernières heures)
          </h2>
          <ul className="divide-y divide-zinc-800 text-sm">
            {done.map((o) => (
              <li key={o.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="font-bold text-paper">n° {o.number}</span>{" "}
                  <span className="text-zinc-400">· {o.username ?? "membre"} · {ORDER_STATUS_LABEL[o.status]}</span>
                </span>
                <span className="shrink-0 tabular-nums text-paper">{formatChf(o.total_chf)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StaffOrderCard({ order, busy, children }: { order: Order; busy: boolean; children: React.ReactNode }) {
  return (
    <article className={`border-2 bg-charcoal p-4 ${order.status === "pending" ? "border-torii" : order.status === "ready" ? "border-gold" : "border-zinc-700"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl text-paper">n° {order.number}</h3>
        <span className="text-right">
          <span className="block font-extrabold tabular-nums text-paper">{formatChf(order.total_chf)} CHF</span>
          <span className={`text-[11px] font-bold uppercase ${order.payment_status === "paid" ? "text-ok" : "text-gold-ink"}`}>
            {order.payment_status === "paid" ? "Payée en ligne" : "À encaisser"}
          </span>
        </span>
      </div>
      <p className="text-xs text-zinc-400">
        {order.username ?? "Membre"} · {formatDateTimeShort(order.created_at)}
      </p>
      <ul className="mt-3 space-y-0.5 text-sm text-paper">
        {order.items.map((i, n) => (
          <li key={n}>
            <strong className="tabular-nums">{i.quantity} ×</strong> {i.name}
          </li>
        ))}
      </ul>
      {order.note && <p className="mt-2 border-l-4 border-gold bg-gold/10 px-2 py-1 text-sm text-paper">« {order.note} »</p>}
      <div className="mt-3">
        <OrderProgress order={order} />
      </div>
      <div className={`mt-4 flex gap-2 ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy && <Loader2 className="size-5 animate-spin self-center text-zinc-400" />}
        {children}
      </div>
    </article>
  );
}

function receiptMessage(order: Order, receipt: TransactionReceipt | null) {
  if (!receipt) return `Commande n° ${order.number} remise.`;
  const premium = receipt.premium_unlocked ? " · Pass Premium débloqué !" : "";
  return `n° ${order.number} remise · +${formatXp(receipt.xp_gained)} XP pour ${receipt.username}${premium}`;
}

/** Petit « ding » pour signaler une nouvelle commande (ignoré si le navigateur bloque le son). */
function ping() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    // pas de son disponible
  }
}
