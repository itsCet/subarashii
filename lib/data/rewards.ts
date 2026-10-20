import "server-only";
import { getDemoDashboard } from "@/lib/demo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { MyReward } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/** Récompenses du Pass réclamées par le joueur connecté. */
export async function getMyRewards(): Promise<MyReward[]> {
  if (!isSupabaseConfigured) {
    const { tiers, claimed } = getDemoDashboard();
    return claimed.flatMap(({ tier_id, track }) => {
      const tier = tiers.find((t) => t.id === tier_id);
      if (!tier) return [];
      const free = track === "free";
      return [
        {
          id: `${tier_id}:${track}`,
          tier_level: tier.level,
          track,
          reward: free ? tier.free_reward : tier.premium_reward,
          icon_name: free ? tier.free_icon_name : tier.icon_name,
          redeemable: free ? tier.free_redeemable : tier.premium_redeemable,
          claimed_at: new Date().toISOString(),
          redeemed_at: null,
        },
      ];
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_rewards");
  if (error) {
    console.error("[rewards] chargement impossible :", error.message);
    return [];
  }
  return data ?? [];
}
