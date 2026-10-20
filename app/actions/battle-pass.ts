"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Track } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const ERRORS: Record<string, string> = {
  NOT_AUTHENTICATED: "Connecte-toi pour continuer.",
  LEVEL_TOO_LOW: "Niveau insuffisant pour ce palier.",
  PREMIUM_REQUIRED: "Récompense réservée au Pass Premium.",
  ALREADY_CLAIMED: "Récompense déjà réclamée.",
  NO_REWARD: "Aucune récompense sur ce palier.",
  TIER_NOT_FOUND: "Palier introuvable.",
  QUEST_NOT_READY: "Quête pas encore accomplie.",
  ALREADY_COMPLETED: "Quête déjà validée.",
  QUEST_NOT_FOUND: "Quête introuvable.",
};

function toError(message: string | undefined) {
  return ERRORS[message ?? ""] ?? "Une erreur est survenue. Réessaie.";
}

export async function claimReward(tierId: string, track: Track): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Mode démo : Supabase non configuré." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_reward", { p_tier_id: tierId, p_track: track });
  if (error) return { ok: false, error: toError(error.message) };
  return { ok: true, data: undefined };
}

export async function completeQuest(
  questId: string,
): Promise<ActionResult<{ xp_gained: number; xp: number; level: number }>> {
  if (!isSupabaseConfigured) return { ok: false, error: "Mode démo : Supabase non configuré." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_quest", { p_quest_id: questId });
  if (error) return { ok: false, error: toError(error.message) };
  return { ok: true, data: data as { xp_gained: number; xp: number; level: number } };
}
