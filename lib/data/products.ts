import "server-only";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { DEMO_PRODUCTS } from "@/lib/products-content";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Product } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// PostgREST renvoie les `numeric` sous forme de chaîne.
export const normalizeProduct = (p: Product): Product => ({ ...p, price_chf: Number(p.price_chf) });

/** Articles visibles : publiés pour le public, tous pour le staff (RLS). */
export async function getProducts(): Promise<Product[]> {
  await connection();
  if (!isSupabaseConfigured) return DEMO_PRODUCTS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(normalizeProduct);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[products] chargement impossible :", error);
    return [];
  }
}
