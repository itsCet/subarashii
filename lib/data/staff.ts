import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { getDemoEvents } from "@/lib/data/events";
import { getDemoDashboard } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, RecentTransaction, StaffEvent } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile } from "./dashboard";

export type StaffAccess =
  | { status: "ok"; mode: "demo" | "live"; profile: Profile }
  | { status: "anonymous" }
  | { status: "forbidden" };

/** Mis en cache par requête : le layout et la page peuvent l'appeler sans requête en double. */
export const getStaffAccess = cache(async (): Promise<StaffAccess> => {
  await connection();
  if (!isSupabaseConfigured) {
    return { status: "ok", mode: "demo", profile: { ...getDemoDashboard().profile, username: "Équipe démo", role: "admin" } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data || (data.role !== "cashier" && data.role !== "admin")) return { status: "forbidden" };
  return { status: "ok", mode: "live", profile: normalizeProfile(data) };
});

export async function getStaffEvents(mode: "demo" | "live"): Promise<StaffEvent[]> {
  if (mode === "demo") {
    return getDemoEvents().map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description,
      category: e.category,
      tag: e.tag,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      price_chf: e.price_chf,
      conditions: e.conditions,
      capacity: e.capacity,
      image_url: e.image_url,
      is_published: true,
      registrations: e.capacity !== null && e.spots_left !== null ? e.capacity - e.spots_left : 0,
    }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_staff_events");
  if (error) throw error;
  return (data ?? []).map((e) => ({ ...e, price_chf: Number(e.price_chf) }));
}

export async function getRecentTransactions(mode: "demo" | "live"): Promise<RecentTransaction[]> {
  if (mode === "demo") return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_recent_transactions", { p_limit: 15 });
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, amount_chf: Number(t.amount_chf) }));
}
