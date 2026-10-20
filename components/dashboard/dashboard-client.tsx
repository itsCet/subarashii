"use client";

import { Gift, Hourglass, ScanLine } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { claimReward, completeQuest } from "@/app/actions/battle-pass";
import { Toaster, useToasts } from "@/components/ui/toaster";
import { useNow } from "@/lib/hooks/use-now";
import type { DashboardData } from "@/lib/data/dashboard";
import { type Track, applyTransaction, formatChf, levelForXp, rewardState } from "@/lib/game";
import { createClient } from "@/lib/supabase/client";
import type { BattlePassTier, PlayerQuest, Profile } from "@/lib/supabase/database.types";
import { formatDuration, seasonEndsAt } from "@/lib/time";
import { BattlePassTimeline, rewardKey } from "./battle-pass-timeline";
import { DailyQuests } from "./daily-quests";
import { PassProgressBanner } from "./pass-progress-banner";
import { PlayerHeader } from "./player-header";
import { PremiumUnlockedOverlay } from "./premium-unlocked-overlay";

export function DashboardClient({ initial }: { initial: DashboardData }) {
  const demo = initial.mode === "demo";
  const [profile, setProfile] = useState(initial.profile);
  const [quests, setQuests] = useState(initial.quests);
  const [claimed, setClaimed] = useState(() => new Set(initial.claimed.map((c) => rewardKey(c.tier_id, c.track))));
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const { toasts, push } = useToasts();
  const timelineRef = useRef<HTMLElement>(null);

  const level = levelForXp(profile.xp);

  const claimable = useMemo(() => {
    const count = (track: Track) =>
      initial.tiers.filter(
        (t) =>
          rewardState({
            reward: track === "free" ? t.free_reward : t.premium_reward,
            track,
            tierLevel: t.level,
            playerLevel: level,
            isPremium: profile.is_premium_pass,
            claimed: claimed.has(rewardKey(t.id, track)),
          }) === "claimable",
      ).length;
    return { free: count("free"), premium: count("premium") };
  }, [initial.tiers, level, profile.is_premium_pass, claimed]);

  /** Applique un nouvel état de profil et déclenche les feedbacks (XP, niveau, Premium). */
  const profileRef = useRef(profile);
  function applyProfile(next: Profile) {
    const prev = profileRef.current;
    profileRef.current = next;
    setProfile(next);

    if (next.xp > prev.xp) push(`+${next.xp - prev.xp} XP`, "xp");
    if (levelForXp(next.xp) > levelForXp(prev.xp)) push(`Niveau ${levelForXp(next.xp)} atteint !`, "info");
    if (!prev.is_premium_pass && next.is_premium_pass) setCelebrate(true);
  }

  // Temps réel : le caissier valide un ticket → XP et Pass Premium mis à jour instantanément.
  const applyProfileRef = useRef(applyProfile);
  useEffect(() => {
    applyProfileRef.current = applyProfile;
  });
  useEffect(() => {
    if (demo) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`profile:${initial.profile.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${initial.profile.id}` },
        (payload) => {
          const next = payload.new as Profile;
          applyProfileRef.current({ ...next, current_season_spent: Number(next.current_season_spent) });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [demo, initial.profile.id]);

  async function handleClaim(tier: BattlePassTier, track: Track) {
    const key = rewardKey(tier.id, track);
    setPendingKey(key);
    const result = demo ? ({ ok: true } as const) : await claimReward(tier.id, track);
    setPendingKey(null);

    if (!result.ok) return push(result.error, "error");
    setClaimed((prev) => new Set(prev).add(key));
    push(`Récompense obtenue : ${track === "free" ? tier.free_reward : tier.premium_reward}`, track === "premium" ? "xp" : "info");
  }

  async function handleQuest(quest: PlayerQuest) {
    setPendingKey(quest.id);
    const result = demo
      ? ({ ok: true, data: { xp: profileRef.current.xp + quest.xp_reward } } as const)
      : await completeQuest(quest.id);
    setPendingKey(null);

    if (!result.ok) return push(result.error, "error");
    setQuests((qs) => qs.map((q) => (q.id === quest.id ? { ...q, completed: true } : q)));
    applyProfile({ ...profileRef.current, xp: result.data.xp, level: levelForXp(result.data.xp) });
  }

  function simulatePurchase(amount: number) {
    const outcome = applyTransaction(profileRef.current, amount);
    setQuests((qs) =>
      qs.map((q) =>
        q.verification === "purchase"
          ? { ...q, progress: Math.min(q.progress + 1, q.target_value) }
          : q.verification === "spend"
            ? { ...q, progress: Math.min(q.progress + amount, q.target_value) }
            : q,
      ),
    );
    applyProfile({
      ...profileRef.current,
      xp: outcome.xp,
      level: outcome.level,
      current_season_spent: outcome.currentSeasonSpent,
      is_premium_pass: outcome.isPremiumPass,
    });
  }

  function closeCelebration() {
    setCelebrate(false);
    timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      <Toaster toasts={toasts} />

      {demo && <DemoPanel onPurchase={simulatePurchase} />}

      <PlayerHeader profile={{ ...profile, level }} />

      <PassProgressBanner
        spent={profile.current_season_spent}
        isPremium={profile.is_premium_pass}
        premiumRewardsReady={claimable.premium}
      />

      <section ref={timelineRef} aria-labelledby="pass-title" className="scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sakura">
              {initial.season?.title ?? "Hors saison"}
            </p>
            <h2 id="pass-title" className="font-display text-lg text-paper">
              Pass de Combat
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {claimable.free + claimable.premium > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sakura/50 bg-sakura/10 px-2.5 py-1 text-[11px] font-semibold text-sakura">
                <Gift className="size-3.5" /> {claimable.free + claimable.premium} à réclamer
              </span>
            )}
            {initial.season && <SeasonCountdown endDate={initial.season.end_date} />}
          </div>
        </div>

        {initial.tiers.length > 0 ? (
          <BattlePassTimeline
            tiers={initial.tiers}
            playerLevel={level}
            isPremium={profile.is_premium_pass}
            claimed={claimed}
            pendingKey={pendingKey}
            onClaim={handleClaim}
          />
        ) : (
          <p className="rounded-sm border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
            Aucune saison active pour le moment. Reviens bientôt !
          </p>
        )}
      </section>

      <DailyQuests quests={quests} pendingId={pendingKey} onComplete={handleQuest} />

      <PremiumUnlockedOverlay open={celebrate} rewardsReady={claimable.premium} onClose={closeCelebration} />
    </div>
  );
}

function SeasonCountdown({ endDate }: { endDate: string }) {
  const now = useNow();
  const remaining = now === null ? null : Math.max(Math.floor((seasonEndsAt(endDate) - now) / 1000), 0);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 tabular-nums">
      <Hourglass className="size-3.5 text-gold" />
      {remaining === null ? "…" : remaining > 0 ? `Fin dans ${formatDuration(remaining)}` : "Saison terminée"}
    </span>
  );
}

const DEMO_AMOUNTS = [6.5, 12, 18.5];

function DemoPanel({ onPurchase }: { onPurchase: (amount: number) => void }) {
  return (
    <aside className="rounded-sm border border-dashed border-gold/40 bg-gold/5 p-3 text-xs text-zinc-300">
      <p>
        <strong className="text-gold">Mode démo</strong> — Supabase n&apos;est pas configuré, les
        données sont locales. Simule un ticket de caisse :
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {DEMO_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onPurchase(amount)}
            className="inline-flex items-center gap-1 rounded-sm border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 font-semibold text-paper transition hover:border-gold active:scale-95"
          >
            <ScanLine className="size-3.5 text-gold" /> {formatChf(amount)} CHF
          </button>
        ))}
      </div>
    </aside>
  );
}
