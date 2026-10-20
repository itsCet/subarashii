import "server-only";
import { connection } from "next/server";
import { getDemoDashboard } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  BattlePassTier,
  PlayerQuest,
  Profile,
  Season,
  Track,
} from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ClaimedReward = { tier_id: string; track: Track };

export type DashboardData = {
  mode: "demo" | "live";
  profile: Profile;
  season: Season | null;
  tiers: BattlePassTier[];
  claimed: ClaimedReward[];
  quests: PlayerQuest[];
};

/** `null` = Supabase configuré mais aucun joueur connecté. */
export async function getDashboardData(): Promise<DashboardData | null> {
  await connection(); // toujours rendu à la requête (données du joueur)
  if (!isSupabaseConfigured) return getDemoDashboard();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, seasonRes, questsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("seasons").select("*").eq("is_active", true).maybeSingle(),
    supabase.rpc("get_my_quests"),
  ]);

  if (profileRes.error) throw profileRes.error;
  const season = seasonRes.data;

  const [tiersRes, claimedRes] = await Promise.all([
    season
      ? supabase.from("battle_pass_tiers").select("*").eq("season_id", season.id).order("level")
      : null,
    supabase.from("user_rewards").select("tier_id, track").eq("user_id", user.id),
  ]);
  const tiers = tiersRes?.data ?? [];
  const tierIds = new Set(tiers.map((t) => t.id));

  return {
    mode: "live",
    profile: normalizeProfile(profileRes.data),
    season,
    tiers,
    claimed: (claimedRes.data ?? []).filter((r) => tierIds.has(r.tier_id)),
    quests: (questsRes.data ?? []).map((q) => ({
      ...q,
      target_value: Number(q.target_value),
      progress: Number(q.progress),
    })),
  };
}

// PostgREST renvoie les `numeric` sous forme de chaîne.
export function normalizeProfile(p: Profile): Profile {
  return { ...p, current_season_spent: Number(p.current_season_spent) };
}
