import { Clock, MapPin, Navigation, TrainFront } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { CAFE } from "@/lib/cafe";
import { HoursTable, OpenStatusBadge } from "./opening-hours";

export function PracticalInfo() {
  return (
    <section id="infos" aria-labelledby="infos-title" className="scroll-mt-24">
      <SectionTitle kicker="Infos pratiques" title="Horaires & Accès" id="infos-title" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="manga-panel rounded-xl p-5 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-extrabold text-paper">
              <Clock className="size-4 text-gold" /> Horaires d&apos;ouverture
            </h3>
            <OpenStatusBadge />
          </div>
          <HoursTable />
        </div>

        <div className="manga-panel flex flex-col rounded-xl p-5 shadow-card">
          <h3 className="flex items-center gap-2 font-extrabold text-paper">
            <MapPin className="size-4 text-torii" /> Adresse
          </h3>
          <address className="mt-2 not-italic text-zinc-300">
            {CAFE.address.street}
            <br />
            {CAFE.address.zip} {CAFE.address.city}
          </address>

          <h3 className="mt-5 flex items-center gap-2 font-extrabold text-paper">
            <TrainFront className="size-4 text-gold" /> Accès
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {CAFE.access.map((a) => (
              <li key={a.mode} className="flex gap-2">
                <span className="w-24 shrink-0 font-bold text-zinc-300">{a.mode}</span>
                <span className="text-zinc-400">{a.detail}</span>
              </li>
            ))}
          </ul>

          <a
            href={CAFE.address.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-xl border-2 border-black bg-paper px-4 py-2 text-sm font-extrabold text-ink shadow-panel transition hover:-translate-y-0.5"
          >
            <Navigation className="size-4" /> Itinéraire
          </a>
        </div>
      </div>
    </section>
  );
}
