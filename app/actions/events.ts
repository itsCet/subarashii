"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./battle-pass";

const ERRORS: Record<string, string> = {
  NOT_AUTHENTICATED: "Connecte-toi pour t'inscrire.",
  EVENT_FULL: "Plus de places disponibles.",
  EVENT_STARTED: "L'événement a déjà commencé.",
  ALREADY_REGISTERED: "Tu es déjà inscrit·e.",
  EVENT_NOT_FOUND: "Événement introuvable.",
};

export async function registerForEvent(eventId: string): Promise<ActionResult<{ spotsLeft: number | null }>> {
  if (!isSupabaseConfigured) return { ok: false, error: "Mode démo : Supabase non configuré." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_for_event", { p_event_id: eventId });
  if (error) return { ok: false, error: ERRORS[error.message] ?? "Inscription impossible. Réessaie." };
  return { ok: true, data: { spotsLeft: data } };
}
