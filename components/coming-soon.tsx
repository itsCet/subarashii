import type { LucideIcon } from "lucide-react";

export function ComingSoon({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-neon-violet backdrop-blur-md">
      <Icon className="size-8 text-neon-pink" />
      <h1 className="mt-4 font-display text-2xl text-white">{title}</h1>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-cyber-yellow">Bientôt disponible</p>
      <ul className="mt-5 space-y-2 text-sm text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-neon-violet">▸</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
