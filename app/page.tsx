import { Hero } from "@/components/home/hero";
import { Partners } from "@/components/home/partners";
import { PassTeaser } from "@/components/home/pass-teaser";
import { PracticalInfo } from "@/components/home/practical-info";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { getUpcomingEvents } from "@/lib/data/events";
import { getPlayerSummary } from "@/lib/data/player";

export default async function HomePage() {
  const [events, player] = await Promise.all([getUpcomingEvents(3), getPlayerSummary()]);

  return (
    <div className="space-y-12">
      <Hero />
      <UpcomingEvents events={events} />
      <PassTeaser profile={player.profile} />
      <PracticalInfo />
      <Partners />
    </div>
  );
}
