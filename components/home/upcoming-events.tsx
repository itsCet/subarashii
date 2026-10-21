import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { EventDate, EventMeta } from "@/components/events/event-card";
import { SectionTitle } from "@/components/ui/section-title";
import type { UpcomingEvent } from "@/lib/supabase/database.types";

export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  return (
    <section aria-labelledby="events-title">
      <SectionTitle index="01" title="À l'agenda" id="events-title" aside="イベント" action={{ href: "/events", label: "Tout le programme" }} />
      {events.length === 0 ? (
        <p className="py-6 text-sm text-zinc-400">Le prochain programme arrive bientôt.</p>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {events.map((event) => (
            <li key={event.id}>
              <Link href="/events" className="group flex items-center gap-4 py-4">
                <EventDate iso={event.starts_at} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg leading-tight font-extrabold text-paper group-hover:text-torii-ink">{event.title}</h3>
                  <EventMeta event={event} />
                </div>
                <ArrowRight className="size-5 shrink-0 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-torii-ink" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
