import { Handshake } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";
import { PARTNERS } from "@/lib/cafe";

export function Partners() {
  return (
    <section aria-labelledby="partners-title">
      <SectionTitle kicker="仲間" title="Nos Partenaires" id="partners-title" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PARTNERS.map((p) => {
          const content = (
            <>
              <span className="grid size-12 shrink-0 place-items-center rounded-lg border-2 border-black bg-paper font-display text-lg text-ink shadow-panel">
                {p.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-gold">{p.kind}</span>
                <span className="block font-extrabold text-paper">{p.name}</span>
                <span className="block text-xs text-zinc-400">{p.description}</span>
              </span>
            </>
          );
          return (
            <li key={p.name}>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="manga-panel flex h-full items-center gap-3 rounded-xl p-4 transition hover:border-zinc-500"
                >
                  {content}
                </a>
              ) : (
                <div className="manga-panel flex h-full items-center gap-3 rounded-xl p-4">{content}</div>
              )}
            </li>
          );
        })}
        <li>
          <div className="flex h-full items-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 p-4 text-zinc-400">
            <Handshake className="size-8 shrink-0 text-torii" />
            <span className="text-sm">
              <strong className="block text-paper">Devenir partenaire</strong>
              Boutique, asso ou créateur ? Parlons-en au comptoir.
            </span>
          </div>
        </li>
      </ul>
    </section>
  );
}
