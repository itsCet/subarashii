import "server-only";
import { connection } from "next/server";
import { getDemoDashboard } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile } from "./dashboard";

/** Profil du joueur connecté (ou démo), `null` si visiteur non connecté. */
export async function getPlayerSummary(): Promise<{ mode: "demo" | "live"; profile: Profile | null }> {
  await connection();
  if (!isSupabaseConfigured) return { mode: "demo", profile: getDemoDashboard().profile };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { mode: "live", profile: null };

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return { mode: "live", profile: data ? normalizeProfile(data) : null };
  } catch (error) {
    console.error("[player] chargement du profil impossible :", error);
    return { mode: "live", profile: null };
  }
}
