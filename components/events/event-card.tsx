import { formatChf } from "@/lib/game";
import { EVENT_CATEGORIES } from "@/lib/events-content";
import type { EventCategory, UpcomingEvent } from "@/lib/supabase/database.types";
import { eventDayParts, formatEventTime } from "@/lib/time";

export const CATEGORY_COLOR: Record<EventCategory, string> = {
  tcg: "text-torii",
  game_night: "text-gold",
  nocturne: "text-sakura",
};

export const categoryLabel = (c: EventCategory) => EVENT_CATEGORIES.find((x) => x.key === c)?.label ?? c;

export function formatPrice(price: number) {
  return price === 0 ? "Gratuit" : `${formatChf(price)} CHF`;
}

export function spotsLabel(spots: number | null) {
  if (spots === null) return "Places illimitées";
  if (spots === 0) return "Complet";
  return `${spots} place${spots > 1 ? "s" : ""} restante${spots > 1 ? "s" : ""}`;
}

/** Colonne date d'une ligne de programme : grand numéro du jour, jour et mois en petit. */
export function EventDate({ iso }: { iso: string }) {
  const { day, month, weekday } = eventDayParts(iso);
  return (
    <div className="w-14 shrink-0 text-center leading-none">
      <span className="block text-[11px] font-bold uppercase text-zinc-500">{weekday}</span>
      <span className="block font-display text-3xl text-paper">{day}</span>
      <span className="block text-[11px] font-bold uppercase text-zinc-500">{month}</span>
    </div>
  );
}

export function EventMeta({ event }: { event: UpcomingEvent }) {
  return (
    <p className="mt-1 text-xs text-zinc-400">
      <span className={`font-extrabold uppercase ${CATEGORY_COLOR[event.category]}`}>{event.tag ?? categoryLabel(event.category)}</span>
      <span className="mx-1.5 text-zinc-600">/</span>
      {formatEventTime(event.starts_at)}
      <span className="mx-1.5 text-zinc-600">/</span>
      {formatPrice(event.price_chf)}
    </p>
  );
}
