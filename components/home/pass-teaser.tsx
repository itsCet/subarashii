import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PREMIUM_THRESHOLD_CHF, formatChf, formatXp, levelForXp, premiumProgress } from "@/lib/game";
import type { Profile } from "@/lib/supabase/database.types";

export function PassTeaser({ profile }: { profile: Profile | null }) {
  const progress = profile ? premiumProgress(profile.current_season_spent) : null;

  return (
    <section aria-labelledby="pass-teaser-title" className="border-[6px] border-black bg-gold p-5 text-black sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em]">Pass de saison & fidélité</p>
          <h2 id="pass-teaser-title" className="mt-1 font-display text-2xl leading-tight sm:text-3xl">
            {!profile
              ? "Chaque passage en caisse te fait monter de niveau."
              : profile.is_premium_pass
                ? "Ta voie Premium est ouverte."
                : `${formatChf(profile.current_season_spent)} / ${formatChf(PREMIUM_THRESHOLD_CHF)} CHF`}
          </h2>

          {profile && progress ? (
            <>
              {!profile.is_premium_pass && (
                <ProgressBar value={progress.ratio} tone="ink" className="mt-3 h-3" label="Progression vers le Pass Premium" />
              )}
              <p className="mt-2 text-sm">
                Niveau {levelForXp(profile.xp)} · {formatXp(profile.xp)} XP
                {!profile.is_premium_pass && <> · encore {formatChf(progress.remaining)} CHF pour la voie Premium</>}
              </p>
            </>
          ) : (
            <p className="mt-2 max-w-xl text-sm">
              1 CHF = 10 XP. Trente paliers de récompenses dans la saison, et la voie Premium s&apos;ouvre dès 25 CHF dépensés.
            </p>
          )}
        </div>

        <Link
          href={profile ? "/pass" : "/login?next=/pass"}
          className="shrink-0 border-2 border-black bg-ink px-5 py-3 text-center text-sm font-extrabold text-paper hover:bg-black"
        >
          {profile ? "Ouvrir mon pass" : "Rejoindre le pass"}
        </Link>
      </div>
    </section>
  );
}
