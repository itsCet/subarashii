import Link from "next/link";
import { EventHeading } from "@/components/events/event-card";
import { SectionTitle } from "@/components/ui/section-title";
import type { UpcomingEvent } from "@/lib/supabase/database.types";

export function UpcomingEvents({ events }: { events: UpcomingEvent[] }) {
  return (
    <section aria-labelledby="events-title">
      <SectionTitle kicker="Prochainement !" title="Prochains événements" id="events-title" action={{ href: "/events", label: "Tout l'agenda" }} />
      {events.length === 0 ? (
        <p className="manga-panel rounded-xl p-6 text-sm text-zinc-400">Le prochain programme arrive très bientôt.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href="/events"
                className="manga-panel block h-full rounded-xl p-4 shadow-card transition hover:-translate-y-0.5 hover:border-zinc-500"
              >
                <EventHeading event={event} compact />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
