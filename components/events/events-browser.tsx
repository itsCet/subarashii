"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { registerForEvent } from "@/app/actions/events";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Toaster, useToasts } from "@/components/ui/toaster";
import { EVENT_CATEGORIES } from "@/lib/events-content";
import type { EventCategory, UpcomingEvent } from "@/lib/supabase/database.types";
import { formatEventDate } from "@/lib/time";
import { CATEGORY_STYLES, EventHeading, spotsLabel } from "./event-card";

type Props = {
  events: UpcomingEvent[];
  mode: "demo" | "live";
  isLoggedIn: boolean;
};

export function EventsBrowser({ events: initialEvents, mode, isLoggedIn }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState<EventCategory | "all">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { toasts, push } = useToasts();

  const visible = filter === "all" ? events : events.filter((e) => e.category === filter);
  const counts = Object.fromEntries(EVENT_CATEGORIES.map((c) => [c.key, events.filter((e) => e.category === c.key).length]));

  async function register(event: UpcomingEvent) {
    setPendingId(event.id);
    const result =
      mode === "demo"
        ? ({ ok: true, data: { spotsLeft: event.spots_left === null ? null : event.spots_left - 1 } } as const)
        : await registerForEvent(event.id);
    setPendingId(null);

    if (!result.ok) return push(result.error, "error");
    setEvents((list) =>
      list.map((e) => (e.id === event.id ? { ...e, is_registered: true, spots_left: result.data.spotsLeft } : e)),
    );
    push(`Inscription confirmée : ${event.title} 🎉`, "info");
  }

  return (
    <>
      <Toaster toasts={toasts} />

      <div role="tablist" aria-label="Catégories" className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Tout" count={events.length} />
        {EVENT_CATEGORIES.map((c) => (
          <FilterChip
            key={c.key}
            active={filter === c.key}
            onClick={() => setFilter(c.key)}
            label={c.label}
            count={counts[c.key]}
          />
        ))}
      </div>

      {filter !== "all" && (
        <p className="-mt-3 mb-5 text-sm text-zinc-400">
          {EVENT_CATEGORIES.find((c) => c.key === filter)?.examples}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="manga-panel rounded-xl p-8 text-center text-sm text-zinc-400">
          Aucun événement prévu dans cette catégorie pour le moment.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visible.map((event) => (
              <motion.li
                key={event.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={`manga-panel flex flex-col rounded-xl p-4 shadow-card ${CATEGORY_STYLES[event.category].panel}`}
              >
                <p className="mb-3 text-xs font-bold first-letter:uppercase text-zinc-400">
                  {formatEventDate(event.starts_at)}
                </p>
                <EventHeading event={event} />
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{event.description}</p>
                {event.conditions && (
                  <p className="mt-2 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-400">
                    {event.conditions}
                  </p>
                )}

                <div className="mt-auto pt-4">
                  {event.capacity !== null && event.spots_left !== null && (
                    <div className="mb-3">
                      <div className="mb-1 flex justify-between text-[11px] font-bold">
                        <span className={event.spots_left <= 3 ? "text-torii" : "text-zinc-400"}>
                          {spotsLabel(event.spots_left)}
                        </span>
                        <span className="text-zinc-500">{event.capacity} places</span>
                      </div>
                      <ProgressBar
                        value={(event.capacity - event.spots_left) / event.capacity}
                        tone={event.spots_left <= 3 ? "torii" : "gold"}
                        className="h-1.5"
                        label={`Remplissage ${event.title}`}
                      />
                    </div>
                  )}
                  <RegisterButton
                    event={event}
                    pending={pendingId === event.id}
                    needsLogin={mode === "live" && !isLoggedIn}
                    onRegister={() => register(event)}
                  />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${
        active ? "border-black bg-paper text-ink shadow-panel" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
      }`}
    >
      {label} <span className={active ? "text-torii" : "text-zinc-500"}>{count}</span>
    </button>
  );
}

function RegisterButton({
  event,
  pending,
  needsLogin,
  onRegister,
}: {
  event: UpcomingEvent;
  pending: boolean;
  needsLogin: boolean;
  onRegister: () => void;
}) {
  const base = "flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-extrabold transition";

  if (event.is_registered) {
    return (
      <p className={`${base} border border-emerald-500/40 bg-emerald-500/10 text-emerald-400`}>
        <Check className="size-4" /> Inscrit·e — à bientôt !
      </p>
    );
  }
  if (event.spots_left === 0) {
    return <p className={`${base} border border-zinc-700 text-zinc-500`}>Complet</p>;
  }
  if (needsLogin) {
    return (
      <Link href="/login?next=/events" className={`${base} border border-zinc-600 text-paper hover:border-torii`}>
        <LogIn className="size-4" /> Se connecter pour s&apos;inscrire
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onRegister}
      disabled={pending}
      className={`${base} bg-torii text-paper shadow-torii hover:bg-torii-bright active:scale-[0.98] disabled:opacity-70`}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {event.price_chf === 0 ? "S'inscrire" : "Réserver ma place"}
    </button>
  );
}
