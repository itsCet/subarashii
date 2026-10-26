import { Crown, Lock, QrCode } from "lucide-react";
import Link from "next/link";
import { ChakraGauge } from "@/components/ui/chakra-gauge";
import { PREMIUM_THRESHOLD_CHF, formatChf, premiumProgress } from "@/lib/game";

type Props = {
  spent: number;
  isPremium: boolean;
  premiumRewardsReady: number;
};

export function PassProgressBanner({ spent, isPremium, premiumRewardsReady }: Props) {
  if (isPremium) {
    return (
      <section className="relative overflow-hidden rounded-sm border border-gold/50 bg-amber-950/20 p-5">
        <div className="relative flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-sm bg-gold text-black">
            <Crown className="size-6" />
          </div>
          <div>
            <p className="font-display text-lg text-gold-ink">Pass Premium VIP actif</p>
            <p className="text-sm text-zinc-300">
              Voie Premium débloquée pour toute la saison
              {premiumRewardsReady > 0 && (
                <>
                  {" "}· <strong className="text-paper">{premiumRewardsReady}</strong> à réclamer
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
    <section className="manga-panel halftone-torii rounded-sm p-5 shadow-panel">
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-sakura-ink">
              <Lock className="size-3" /> Pass Premium
            </p>
            <p className="mt-1 font-display text-2xl text-paper tabular-nums">
              {formatChf(spent)}
              <span className="whitespace-nowrap text-base text-zinc-400"> / {formatChf(PREMIUM_THRESHOLD_CHF)} CHF</span>
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-torii/50 bg-torii/10 px-3 py-2 text-xs font-semibold text-paper transition hover:bg-torii/20"
          >
            <QrCode className="size-4" /> Ma carte
          </Link>
        </div>

        <div className="mt-4">
          <ChakraGauge value={ratio} steps={5} label="Progression vers le Pass Premium" />
          <div aria-hidden className="mt-1 flex justify-between text-[11px] font-bold tabular-nums text-zinc-400">
            {Array.from({ length: 6 }, (_, i) => (i * PREMIUM_THRESHOLD_CHF) / 5).map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-400">
          Plus que <strong className="text-gold-ink">{formatChf(remaining)} CHF</strong> d&apos;achats
          cette saison pour activer automatiquement la voie Premium. Présente ta carte membre en caisse.
        </p>
      </div>
    </section>
  );
}
