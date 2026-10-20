import { Crown, Sparkles } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatXp, levelProgress } from "@/lib/game";
import type { Profile } from "@/lib/supabase/database.types";

export function PlayerHeader({ profile }: { profile: Profile }) {
  const { level, into, needed, ratio } = levelProgress(profile.xp);
  const name = profile.username ?? "Otaku";

  return (
    <section className="flex items-center gap-4">
      <div className="relative shrink-0">
        <div
          className={`rounded-full p-[3px] ${
            profile.is_premium_pass
              ? "bg-[conic-gradient(from_180deg,#e9c46a,#f4a261,#e63946,#e9c46a)]"
              : "bg-[conic-gradient(from_180deg,#e63946,#f4a261,#e63946)]"
          }`}
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar externe (Supabase Storage)
            <img src={profile.avatar_url} alt="" className="size-16 rounded-full bg-zinc-900 object-cover" />
          ) : (
            <div className="grid size-16 place-items-center rounded-full bg-zinc-900 font-display text-2xl text-paper">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="absolute -right-1 -bottom-1 rounded-md border border-zinc-950 bg-gold px-1.5 font-display text-xs text-black">
          {level}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate font-display text-xl text-paper">{name}</h1>
          {profile.is_premium_pass ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/60 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold animate-pulse-glow">
              <Crown className="size-3" /> Premium VIP
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <Sparkles className="size-3" /> Gratuit
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-baseline justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-torii">Niveau {level}</span>
          <span className="tabular-nums text-zinc-400">
            {formatXp(into)} / {formatXp(needed)} XP
          </span>
        </div>
        <ProgressBar value={ratio} className="mt-1 h-2" label="Progression vers le niveau suivant" />
        <p className="mt-1 text-[11px] text-zinc-500">
          Total <span className="font-semibold tabular-nums text-zinc-300">{formatXp(profile.xp)} XP</span>
        </p>
      </div>
    </section>
  );
}
