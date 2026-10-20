import "server-only";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { SAMPLE_EVENTS } from "@/lib/events-content";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UpcomingEvent } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { zurichDateTime } from "@/lib/time";

export async function getUpcomingEvents(limit = 50): Promise<UpcomingEvent[]> {
  await connection();
  if (!isSupabaseConfigured) return getDemoEvents().slice(0, limit);

  // Un agenda indisponible (migration events non appliquée, Supabase injoignable…)
  // ne doit jamais faire tomber l'accueil : on affiche simplement une liste vide.
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_upcoming_events", { p_limit: limit });
    if (error) throw error;
    // PostgREST renvoie les `numeric` sous forme de chaîne.
    return (data ?? []).map((e) => ({ ...e, price_chf: Number(e.price_chf) }));
  } catch (error) {
    unstable_rethrow(error); // laisse passer les signaux internes de Next (rendu dynamique, redirections)
    console.error("[events] chargement impossible :", error);
    return [];
  }
}

function getDemoEvents(): UpcomingEvent[] {
  return SAMPLE_EVENTS.map((e, i) => {
    const start = zurichDateTime(e.day_offset, e.time);
    return {
      id: `demo-event-${e.slug}`,
      slug: e.slug,
      title: e.title,
      description: e.description,
      category: e.category,
      tag: e.tag,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + e.duration_min * 60_000).toISOString(),
      price_chf: e.price_chf,
      conditions: e.conditions,
      capacity: e.capacity,
      image_url: null,
      // Quelques places déjà prises pour rendre la démo réaliste.
      spots_left: e.capacity === null ? null : Math.max(e.capacity - [27, 11, 14, 9, 22, 6, 8, 31][i], 0),
      is_registered: false,
    };
  });
}
