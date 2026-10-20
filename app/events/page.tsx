import type { Metadata } from "next";
import { EventsBrowser } from "@/components/events/events-browser";
import { getUpcomingEvents } from "@/lib/data/events";
import { getPlayerSummary } from "@/lib/data/player";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Tournois TCG, soirées jeux, befores et nocturnes au Subarashii Manga Café.",
};

export default async function EventsPage() {
  const [events, player] = await Promise.all([getUpcomingEvents(), getPlayerSummary()]);

  return (
    <div>
      <header className="mb-6 border-b-2 border-paper pb-4">
        <h1 className="font-display text-4xl text-paper">Agenda</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">Tournois TCG, soirées jeux, befores et nocturnes au café.</p>
      </header>
      <EventsBrowser events={events} mode={player.mode} isLoggedIn={player.profile !== null} />
    </div>
  );
}
