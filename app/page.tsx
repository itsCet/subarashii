import { GalleryTeaser } from "@/components/home/gallery-teaser";
import { Hero } from "@/components/home/hero";
import { Partners } from "@/components/home/partners";
import { PassTeaser } from "@/components/home/pass-teaser";
import { PracticalInfo } from "@/components/home/practical-info";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { getUpcomingEvents } from "@/lib/data/events";
import { getGalleryPhotos } from "@/lib/data/gallery";
import { getPlayerSummary } from "@/lib/data/player";

export default async function HomePage() {
  const [events, player, photos] = await Promise.all([getUpcomingEvents(3), getPlayerSummary(), getGalleryPhotos(6)]);

  return (
    <div className="space-y-14">
      <Hero />
      <UpcomingEvents events={events} />
      <GalleryTeaser photos={photos.filter((p) => p.is_published)} />
      <PassTeaser profile={player.profile} />
      <PracticalInfo />
      <Partners />
    </div>
  );
}
