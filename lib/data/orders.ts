import "server-only";
import { unstable_rethrow } from "next/navigation";
import { normalizeOrder } from "@/lib/orders";
import type { Order } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/** Commandes passées depuis l'app : les miennes (client) ou celles en cours (staff). */
export async function getOrders(scope: "mine" | "open"): Promise<Order[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_orders", { p_scope: scope });
    if (error) throw error;
    return ((data ?? []) as unknown as Order[]).map(normalizeOrder);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[orders] chargement impossible :", error);
    return [];
  }
}
