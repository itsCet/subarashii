import type { Order, OrderStatus } from "./supabase/database.types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Reçue",
  preparing: "En préparation",
  ready: "Prête au comptoir",
  completed: "Remise",
  cancelled: "Annulée",
};

/** PostgREST renvoie les `numeric` sous forme de chaîne. */
export function normalizeOrder(o: Order): Order {
  return {
    ...o,
    total_chf: Number(o.total_chf),
    items: (o.items ?? []).map((i) => ({ ...i, unit_price_chf: Number(i.unit_price_chf) })),
  };
}

export const isOpenOrder = (o: Order) => o.status === "pending" || o.status === "preparing" || o.status === "ready";
