import { SectionTitle } from "@/components/ui/section-title";
import { CAFE } from "@/lib/cafe";
import { HoursTable, OpenStatusBadge } from "./opening-hours";

export function PracticalInfo() {
  return (
    <section id="infos" aria-labelledby="infos-title" className="scroll-mt-24">
      <SectionTitle index="03" title="Horaires & accès" id="infos-title" aside="営業時間" />

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="mb-3">
            <OpenStatusBadge />
          </div>
          <HoursTable />
        </div>

        <div>
          <address className="not-italic">
            <span className="block font-display text-2xl leading-tight text-paper">{CAFE.address.street}</span>
            <span className="block text-paper">
              {CAFE.address.zip} {CAFE.address.city}
            </span>
            <span className="mt-1 block text-sm text-gold-ink">{CAFE.address.note}</span>
          </address>

          <dl className="mt-5 space-y-1.5 text-sm">
            {CAFE.access
              .filter((a) => a.mode !== "Entrée")
              .map((a) => (
                <div key={a.mode} className="flex gap-3">
                  <dt className="w-24 shrink-0 text-zinc-400">{a.mode}</dt>
                  <dd className="text-zinc-300">{a.detail}</dd>
                </div>
              ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={CAFE.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable border-2 border-black bg-paper px-4 py-2.5 text-sm font-extrabold text-ink shadow-panel hover:bg-white"
            >
              Itinéraire
            </a>
            {CAFE.socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-zinc-400 underline-offset-4 hover:text-paper hover:underline"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
