"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Universe } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

const ONBOARDING_ERRORS: Record<string, string> = {
  INVALID_USERNAME: "Ton pseudo doit faire entre 2 et 24 caractères.",
  USERNAME_TAKEN: "Ce pseudo est déjà pris : essaie une variante.",
  INVALID_UNIVERSE: "Choisis un univers.",
  NOT_AUTHENTICATED: "Ta session a expiré : reconnecte-toi.",
};

/** Fin de l'onboarding : pseudo + univers préféré. */
export async function completeOnboarding(
  username: string,
  universe: Universe,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) return { ok: true }; // démo : rien à enregistrer
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", { p_username: username, p_universe: universe });
  if (error) return { ok: false, error: ONBOARDING_ERRORS[error.message] ?? "Une erreur est survenue. Réessaie." };
  return { ok: true };
}
