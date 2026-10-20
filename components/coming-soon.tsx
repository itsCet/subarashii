import type { LucideIcon } from "lucide-react";

export function ComingSoon({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-zinc-700 bg-zinc-900/60 p-6 shadow-card backdrop-blur-md">
      <Icon className="size-8 text-sakura" />
      <h1 className="mt-4 font-display text-2xl text-paper">{title}</h1>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-gold">Bientôt disponible</p>
      <ul className="mt-5 space-y-2 text-sm text-zinc-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-torii">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
