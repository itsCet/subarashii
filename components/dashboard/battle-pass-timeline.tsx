"use client";

import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Crown, Loader2, Lock, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { RewardIcon } from "@/components/ui/reward-icon";
import { type RewardState, type Track, rewardState } from "@/lib/game";
import type { BattlePassTier } from "@/lib/supabase/database.types";

export const rewardKey = (tierId: string, track: Track) => `${tierId}:${track}`;

type Props = {
  tiers: BattlePassTier[];
  playerLevel: number;
  isPremium: boolean;
  claimed: Set<string>;
  pendingKey: string | null;
  onClaim: (tier: BattlePassTier, track: Track) => void;
};

const COLUMN_WIDTH = 132; // px, w-[132px]

export function BattlePassTimeline({ tiers, playerLevel, isPremium, claimed, pendingKey, onClaim }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const currentIndex = Math.min(playerLevel, tiers.length) - 1;

  // Centre la timeline sur le palier actuel au chargement.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(currentIndex - 1, 0) * COLUMN_WIDTH, behavior: "instant" });
  }, [currentIndex]);

  const scrollBy = (dir: 1 | -1) =>
    scrollerRef.current?.scrollBy({ left: dir * COLUMN_WIDTH * 3, behavior: "smooth" });

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-zinc-950 to-transparent" />

      <div className="flex">
        {/* Libellés des voies */}
        <div className="z-10 flex w-11 shrink-0 flex-col gap-2 border-r border-zinc-700 bg-zinc-950/90 pr-2">
          <LaneLabel className="h-44 text-torii" icon={<Sparkles className="size-3.5" />}>
            Gratuit
          </LaneLabel>
          <div className="h-10" />
          <LaneLabel className="h-44 text-gold" icon={isPremium ? <Crown className="size-3.5" /> : <Lock className="size-3.5" />}>
            Premium
          </LaneLabel>
        </div>

        <div
          ref={scrollerRef}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pr-10"
          aria-label="Paliers du Pass de Combat"
        >
          {tiers.map((tier, i) => {
            const reached = tier.level <= playerLevel;
            const isCurrent = i === currentIndex;
            const state = (track: Track) =>
              rewardState({
                reward: track === "free" ? tier.free_reward : tier.premium_reward,
                track,
                tierLevel: tier.level,
                playerLevel,
                isPremium,
                claimed: claimed.has(rewardKey(tier.id, track)),
              });

            return (
              <div key={tier.id} className="flex w-[132px] shrink-0 snap-start flex-col gap-2 px-1.5">
                <RewardCard
                  track="free"
                  label={tier.free_reward}
                  icon={tier.free_icon_name}
                  state={state("free")}
                  pending={pendingKey === rewardKey(tier.id, "free")}
                  onClaim={() => onClaim(tier, "free")}
                />

                {/* Rail de progression */}
                <div className="relative flex h-10 items-center justify-center">
                  <div
                    className={`absolute top-1/2 -right-1.5 -left-1.5 h-1 -tranzinc-y-1/2 ${
                      tier.level < playerLevel
                        ? "bg-torii"
                        : isCurrent
                          ? "bg-gradient-to-r from-sakura via-zinc-800 to-zinc-800"
                          : "bg-zinc-800"
                    }`}
                  />
                  <div
                    className={`relative grid size-9 place-items-center rounded-lg font-display text-sm ${
                      isCurrent
                        ? "bg-gold text-black shadow-gold ring-4 ring-gold/20"
                        : reached
                          ? "bg-torii text-paper shadow-card"
                          : "border border-zinc-700 bg-zinc-900 text-zinc-500"
                    }`}
                    aria-label={`Palier ${tier.level}${isCurrent ? " (actuel)" : ""}`}
                  >
                    {tier.level}
                  </div>
                </div>

                <RewardCard
                  track="premium"
                  label={tier.premium_reward}
                  icon={tier.icon_name}
                  state={state("premium")}
                  pending={pendingKey === rewardKey(tier.id, "premium")}
                  onClaim={() => onClaim(tier, "premium")}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 hidden justify-end gap-2 sm:flex">
        <ScrollButton label="Paliers précédents" onClick={() => scrollBy(-1)}>
          <ChevronLeft className="size-4" />
        </ScrollButton>
        <ScrollButton label="Paliers suivants" onClick={() => scrollBy(1)}>
          <ChevronRight className="size-4" />
        </ScrollButton>
      </div>
    </div>
  );
}

function LaneLabel({ children, icon, className }: { children: string; icon: React.ReactNode; className: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      {icon}
      <span className="rotate-180 text-[11px] font-bold uppercase tracking-[0.3em] [writing-mode:vertical-rl]">
        {children}
      </span>
    </div>
  );
}

function ScrollButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:border-torii hover:text-paper"
    >
      {children}
    </button>
  );
}

const CARD_STYLES: Record<Track, Record<RewardState, string>> = {
  free: {
    claimable: "border-torii/70 bg-torii/10 shadow-card",
    claimed: "border-zinc-700 bg-zinc-900/40",
    locked: "border-zinc-700 bg-zinc-900/60",
    "premium-locked": "",
    empty: "border-dashed border-zinc-700/70 bg-transparent",
  },
  premium: {
    claimable: "border-gold/70 bg-gradient-to-b from-amber-400/15 to-sakura/10 shadow-gold",
    claimed: "border-amber-900/40 bg-amber-950/10",
    locked: "border-amber-900/40 bg-gradient-to-b from-amber-500/5 to-sakura/5",
    "premium-locked": "border-amber-900/40 bg-gradient-to-b from-amber-500/5 to-sakura/5",
    empty: "border-dashed border-zinc-700/70 bg-transparent",
  },
};

function RewardCard({
  track,
  label,
  icon,
  state,
  pending,
  onClaim,
}: {
  track: Track;
  label: string | null;
  icon: string | null;
  state: RewardState;
  pending: boolean;
  onClaim: () => void;
}) {
  const premium = track === "premium";
  const muted = state === "locked" || state === "premium-locked" || state === "claimed";

  return (
    <motion.div
      layout
      className={`relative flex h-44 flex-col items-center rounded-xl border p-2.5 text-center transition-colors ${CARD_STYLES[track][state]}`}
    >
      {state !== "empty" && (
        <>
          <div
            className={`mt-1 grid size-12 place-items-center rounded-xl ${
              premium ? "bg-gold/10 text-gold" : "bg-torii/15 text-red-300"
            } ${muted ? "opacity-50" : ""}`}
          >
            <RewardIcon icon={icon} className="size-6" />
          </div>
          <p className={`mt-2 line-clamp-3 text-xs font-semibold leading-snug ${muted ? "text-zinc-500" : "text-zinc-100"}`}>
            {label}
          </p>

          <div className="mt-auto w-full">
            {state === "claimable" && (
              <button
                type="button"
                onClick={onClaim}
                disabled={pending}
                className={`flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-wider transition active:scale-95 disabled:opacity-70 ${
                  premium
                    ? "bg-gold text-black hover:bg-dorayaki"
                    : "bg-torii text-paper hover:brightness-110"
                }`}
              >
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Réclamer"}
              </button>
            )}
            {state === "claimed" && (
              <span className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                <Check className="size-3.5" /> Obtenu
              </span>
            )}
            {state === "locked" && (
              <span className="flex items-center justify-center gap-1 py-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
                <Lock className="size-3" /> Verrouillé
              </span>
            )}
            {state === "premium-locked" && (
              <span className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gold/80">
                <Crown className="size-3" /> Premium
              </span>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
