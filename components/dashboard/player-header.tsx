import { Crown, Sparkles } from "lucide-react";
import { NeonProgress } from "@/components/ui/neon-progress";
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
              ? "bg-[conic-gradient(from_180deg,#facc15,#ec4899,#8b5cf6,#facc15)]"
              : "bg-[conic-gradient(from_180deg,#8b5cf6,#ec4899,#8b5cf6)]"
          }`}
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar externe (Supabase Storage)
            <img src={profile.avatar_url} alt="" className="size-16 rounded-full bg-slate-900 object-cover" />
          ) : (
            <div className="grid size-16 place-items-center rounded-full bg-slate-900 font-display text-2xl text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="absolute -right-1 -bottom-1 rounded-md border border-slate-950 bg-cyber-yellow px-1.5 font-display text-xs text-black">
          {level}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate font-display text-xl text-white">{name}</h1>
          {profile.is_premium_pass ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-cyber-yellow/60 bg-cyber-yellow/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyber-yellow animate-pulse-glow">
              <Crown className="size-3" /> Premium VIP
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Sparkles className="size-3" /> Gratuit
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-baseline justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-neon-violet">Niveau {level}</span>
          <span className="tabular-nums text-slate-400">
            {formatXp(into)} / {formatXp(needed)} XP
          </span>
        </div>
        <NeonProgress value={ratio} className="mt-1 h-2" label="Progression vers le niveau suivant" />
        <p className="mt-1 text-[11px] text-slate-500">
          Total <span className="font-semibold tabular-nums text-slate-300">{formatXp(profile.xp)} XP</span>
        </p>
      </div>
    </section>
  );
}
