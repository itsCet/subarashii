import { Check, ChefHat, Clock, CreditCard, PartyPopper, X } from "lucide-react";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import type { Order } from "@/lib/supabase/database.types";

const STEPS = ["pending", "preparing", "ready", "completed"] as const;

/** Frise de suivi : reçue → en préparation → prête → remise. */
export function OrderProgress({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-torii-ink">
        <X className="size-4" /> Commande annulée{order.payment_status === "paid" ? " : contacte le comptoir pour le remboursement." : "."}
      </p>
    );
  }
  if (order.payment_method === "online" && order.payment_status === "unpaid") {
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-gold-ink">
        <CreditCard className="size-4" /> Paiement en cours de confirmation…
      </p>
    );
  }

  const current = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const icons = [Clock, ChefHat, PartyPopper, Check];
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label={`Statut : ${ORDER_STATUS_LABEL[order.status]}`}>
      {STEPS.map((step, i) => {
        const Icon = icons[i];
        const done = i <= current;
        return (
          <li key={step} aria-current={i === current ? "step" : undefined} className="flex flex-col gap-1.5">
            <span className={`h-1.5 transition-colors duration-300 ${done ? (step === "ready" ? "bg-gold" : "bg-torii") : "bg-zinc-800"}`} />
            <span className={`flex items-center gap-1 text-[11px] font-bold ${i === current ? "text-paper" : done ? "text-zinc-400" : "text-zinc-600"}`}>
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{ORDER_STATUS_LABEL[step]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
