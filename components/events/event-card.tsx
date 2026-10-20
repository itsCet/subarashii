import { Clock, Ticket, Users } from "lucide-react";
import { formatChf } from "@/lib/game";
import { EVENT_CATEGORIES } from "@/lib/events-content";
import type { EventCategory, UpcomingEvent } from "@/lib/supabase/database.types";
import { eventDayParts, formatEventTime } from "@/lib/time";

export const CATEGORY_STYLES: Record<EventCategory, { badge: string; date: string; panel: string }> = {
  tcg: { badge: "bg-torii text-paper", date: "bg-torii text-paper", panel: "halftone-torii" },
  game_night: { badge: "bg-gold text-ink", date: "bg-gold text-ink", panel: "halftone-gold" },
  nocturne: { badge: "bg-sakura text-ink", date: "bg-sakura text-ink", panel: "" },
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

/** Bloc date + titre commun aux cartes de l'agenda et au widget de l'accueil. */
export function EventHeading({ event, compact = false }: { event: UpcomingEvent; compact?: boolean }) {
  const { day, month, weekday } = eventDayParts(event.starts_at);
  const style = CATEGORY_STYLES[event.category];

  return (
    <div className="flex gap-3">
      <div
        className={`flex w-14 shrink-0 flex-col items-center rounded-lg border-2 border-black py-1.5 shadow-panel ${style.date}`}
      >
        <span className="text-[10px] font-extrabold uppercase">{weekday}</span>
        <span className="font-display text-2xl leading-none">{day}</span>
        <span className="text-[10px] font-extrabold uppercase">{month}</span>
      </div>
      <div className="min-w-0">
        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${style.badge}`}>
          {event.tag ?? categoryLabel(event.category)}
        </span>
        <h3 className={`mt-1 font-display leading-tight text-paper ${compact ? "text-base" : "text-lg"}`}>
          {event.title}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {formatEventTime(event.starts_at)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Ticket className="size-3.5" /> {formatPrice(event.price_chf)}
          </span>
          {!compact && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" /> {spotsLabel(event.spots_left)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
