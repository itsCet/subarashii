"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { registerForEvent } from "@/app/actions/events";
import { Toaster, useToasts } from "@/components/ui/toaster";
import { EVENT_CATEGORIES } from "@/lib/events-content";
import type { EventCategory, UpcomingEvent } from "@/lib/supabase/database.types";
import { EventDate, EventMeta, spotsLabel } from "./event-card";

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
    push(`Inscription confirmée : ${event.title}`, "info");
  }

  return (
    <>
      <Toaster toasts={toasts} />

      <div role="tablist" aria-label="Catégories" className="scrollbar-none -mx-4 mb-2 flex gap-6 overflow-x-auto border-b border-zinc-800 px-4">
        {[{ key: "all" as const, label: "Tout" }, ...EVENT_CATEGORIES].map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(c.key)}
              className={`-mb-px shrink-0 border-b-2 py-3 text-sm font-extrabold transition ${
                active ? "border-torii text-paper" : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {filter !== "all" && (
        <p className="mt-3 text-sm text-zinc-500">{EVENT_CATEGORIES.find((c) => c.key === filter)?.examples}</p>
      )}

      {visible.length === 0 ? (
        <p className="py-10 text-sm text-zinc-400">Rien de prévu dans cette catégorie pour le moment.</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {visible.map((event) => (
            <li key={event.id} className="grid gap-4 py-6 sm:grid-cols-[auto_1fr_13rem] sm:items-start">
              <EventDate iso={event.starts_at} />
              <div className="min-w-0">
                <h2 className="text-xl leading-tight font-extrabold text-paper">{event.title}</h2>
                <EventMeta event={event} />
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-zinc-300">{event.description}</p>
                {event.conditions && <p className="mt-2 text-xs text-zinc-500">{event.conditions}</p>}
              </div>
              <div className="sm:text-right">
                <p className={`mb-2 text-xs font-bold ${event.spots_left !== null && event.spots_left <= 3 ? "text-torii" : "text-zinc-400"}`}>
                  {spotsLabel(event.spots_left)}
                  {event.capacity !== null && <span className="text-zinc-600"> sur {event.capacity}</span>}
                </p>
                <RegisterButton
                  event={event}
                  pending={pendingId === event.id}
                  needsLogin={mode === "live" && !isLoggedIn}
                  onRegister={() => register(event)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
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
  const base = "flex w-full items-center justify-center gap-2 border-2 px-4 py-2.5 text-sm font-extrabold transition";

  if (event.is_registered) {
    return (
      <p className={`${base} border-ok/60 text-ok`}>
        <Check className="size-4" /> Inscrit·e
      </p>
    );
  }
  if (event.spots_left === 0) {
    return <p className={`${base} border-zinc-700 text-zinc-500`}>Complet</p>;
  }
  if (needsLogin) {
    return (
      <Link href="/login?next=/events" className={`${base} border-zinc-500 text-paper hover:border-paper`}>
        Se connecter pour s&apos;inscrire
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onRegister}
      disabled={pending}
      className={`${base} border-black bg-torii text-white shadow-panel hover:bg-torii-bright disabled:opacity-70`}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {event.price_chf === 0 ? "S'inscrire" : "Réserver ma place"}
    </button>
  );
}
