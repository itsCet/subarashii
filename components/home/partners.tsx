import { SectionTitle } from "@/components/ui/section-title";
import { PARTNERS } from "@/lib/cafe";

export function Partners() {
  return (
    <section aria-labelledby="partners-title">
      <SectionTitle index="04" title="Partenaires" id="partners-title" aside="仲間" />
      <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {PARTNERS.map((p) => (
          <li key={p.name} className="border-b border-zinc-800 py-3">
            {p.url ? (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-extrabold text-paper hover:text-torii-ink">
                {p.name}
              </a>
            ) : (
              <span className="font-extrabold text-paper">{p.name}</span>
            )}
            <span className="ml-2 text-xs uppercase text-zinc-400">{p.kind}</span>
            <p className="mt-0.5 text-xs text-zinc-400">{p.description}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-zinc-400">
        Une boutique, une asso ou un projet à monter ensemble ? Passe nous voir au comptoir.
      </p>
    </section>
  );
}
