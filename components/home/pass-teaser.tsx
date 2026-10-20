import { ChevronRight, Crown, Swords } from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PREMIUM_THRESHOLD_CHF, formatChf, formatXp, levelForXp, premiumProgress } from "@/lib/game";
import type { Profile } from "@/lib/supabase/database.types";

export function PassTeaser({ profile }: { profile: Profile | null }) {
  return (
    <section aria-labelledby="pass-teaser-title" className="manga-panel halftone-gold rounded-2xl p-5 shadow-panel sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid size-14 shrink-0 place-items-center rounded-xl border-2 border-black bg-gold text-ink shadow-panel">
          {profile?.is_premium_pass ? <Crown className="size-7" /> : <Swords className="size-7" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-widest text-gold">Pass Saisonnier & Fidélité</p>
          <h2 id="pass-teaser-title" className="mt-0.5 font-display text-xl text-paper">
            {profile
              ? profile.is_premium_pass
                ? "Pass Premium actif 🎉"
                : `${formatChf(profile.current_season_spent)} / ${formatChf(PREMIUM_THRESHOLD_CHF)} CHF`
              : "Chaque visite te fait progresser"}
          </h2>

          {profile ? (
            <>
              {!profile.is_premium_pass && (
                <ProgressBar
                  value={premiumProgress(profile.current_season_spent).ratio}
                  tone="gold"
                  className="mt-3 h-2.5"
                  label="Progression vers le Pass Premium"
                />
              )}
              <p className="mt-2 text-sm text-zinc-400">
                Niveau <strong className="text-paper">{levelForXp(profile.xp)}</strong> · {formatXp(profile.xp)} XP
                {!profile.is_premium_pass && (
                  <> · encore {formatChf(premiumProgress(profile.current_season_spent).remaining)} CHF pour la voie Premium</>
                )}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">
              1 CHF = 10 XP, 30 paliers de récompenses et la voie Premium offerte dès 25 CHF dépensés dans la saison.
            </p>
          )}
        </div>

        <Link
          href={profile ? "/pass" : "/login?next=/pass"}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border-2 border-black bg-paper px-4 py-2.5 text-sm font-extrabold text-ink shadow-panel transition hover:-translate-y-0.5"
        >
          {profile ? "Ouvrir mon Pass" : "Rejoindre le Pass"} <ChevronRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
