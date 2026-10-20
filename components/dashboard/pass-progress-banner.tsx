import { Crown, Lock, QrCode } from "lucide-react";
import Link from "next/link";
import { NeonProgress } from "@/components/ui/neon-progress";
import { PREMIUM_THRESHOLD_CHF, formatChf, premiumProgress } from "@/lib/game";

type Props = {
  spent: number;
  isPremium: boolean;
  premiumRewardsReady: number;
};

export function PassProgressBanner({ spent, isPremium, premiumRewardsReady }: Props) {
  if (isPremium) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-cyber-yellow/50 bg-gradient-to-br from-amber-500/15 via-slate-950 to-neon-pink/10 p-5 shadow-neon-yellow">
        <div
          aria-hidden
          className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_35%,rgba(250,204,21,0.12)_50%,transparent_65%)] bg-[length:200%_100%]"
        />
        <div className="relative flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-cyber-yellow text-black shadow-neon-yellow">
            <Crown className="size-6" />
          </div>
          <div>
            <p className="font-display text-lg text-cyber-yellow">Pass Premium VIP actif</p>
            <p className="text-sm text-slate-300">
              Voie Premium débloquée pour toute la saison
              {premiumRewardsReady > 0 && (
                <>
                  {" "}· <strong className="text-white">{premiumRewardsReady}</strong> à réclamer
                </>
              )}
              .
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { ratio, remaining } = premiumProgress(spent);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-neon-violet backdrop-blur-md">
      <div
        aria-hidden
        className="absolute -top-16 -right-16 size-48 rounded-full bg-neon-pink/20 blur-3xl"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-neon-pink">
              <Lock className="size-3" /> Pass Premium
            </p>
            <p className="mt-1 font-display text-2xl text-white tabular-nums">
              {formatChf(spent)}
              <span className="text-base text-slate-500"> / {formatChf(PREMIUM_THRESHOLD_CHF)} CHF</span>
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neon-violet/50 bg-neon-violet/10 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-neon-violet/20"
          >
            <QrCode className="size-4" /> Ma carte
          </Link>
        </div>

        <NeonProgress value={ratio} className="mt-4 h-3" label="Progression vers le Pass Premium" />

        <p className="mt-3 text-sm text-slate-400">
          Plus que <strong className="text-cyber-yellow">{formatChf(remaining)} CHF</strong> d&apos;achats
          cette saison pour activer automatiquement la voie Premium. Présente ta carte membre en caisse.
        </p>
      </div>
    </section>
  );
}
