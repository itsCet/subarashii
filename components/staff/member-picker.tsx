"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gift, Loader2, ScanLine, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { type MemberSummary, findMembers, getPendingRewards, redeemReward } from "@/app/actions/staff";
import { RewardIcon } from "@/components/ui/reward-icon";
import { formatChf, formatXp } from "@/lib/game";
import type { PendingReward } from "@/lib/supabase/database.types";
import { inputClass, primaryButton, secondaryButton } from "./form";
import { QrScanner } from "./qr-scanner";

const DEMO_PENDING: PendingReward[] = [
  { id: "demo-r1", tier_level: 5, track: "free", reward: "Thé glacé offert", icon_name: "cup-soda", claimed_at: "" },
  { id: "demo-r2", tier_level: 4, track: "premium", reward: "Mochi glacé offert", icon_name: "cookie", claimed_at: "" },
];

export const DEMO_MEMBERS: MemberSummary[] = [
  { id: "demo-1", username: "NeoOtaku", avatar_url: null, xp: 3420, level: 7, current_season_spent: 18.5, is_premium_pass: false },
  { id: "demo-2", username: "Sakura_92", avatar_url: null, xp: 6100, level: 13, current_season_spent: 41, is_premium_pass: true },
  { id: "demo-3", username: "Luffy-GE", avatar_url: null, xp: 120, level: 1, current_season_spent: 4, is_premium_pass: false },
];

type Props = {
  demo: boolean;
  member: MemberSummary | null;
  onChange: (member: MemberSummary | null) => void;
  onError: (message: string | null) => void;
};

/** Étape « membre » de la caisse : scan de la carte ou recherche, et récompenses à remettre. */
export function MemberPicker({ demo, member, onChange, onError }: Props) {
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  // Recherche par pseudo, avec un léger délai pendant la frappe.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = demo
        ? { ok: true as const, data: DEMO_MEMBERS.filter((m) => m.username?.toLowerCase().includes(q.toLowerCase())) }
        : await findMembers(q);
      setSearching(false);
      if (result.ok) setResults(result.data);
      else onError(result.error);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, demo, onError]);

  async function onScan(text: string) {
    setScanning(false);
    onError(null);
    const result = demo ? { ok: true as const, data: [DEMO_MEMBERS[0]] } : await findMembers(text);
    if (!result.ok) return onError(result.error);
    if (result.data.length === 0) return onError("QR code non reconnu : ce n'est pas une carte membre Subarashii.");
    select(result.data[0]);
  }

  async function select(m: MemberSummary) {
    onChange(m);
    setQuery("");
    setResults([]);
    onError(null);
    // Récompenses physiques réclamées par le membre, à remettre au comptoir.
    setPendingRewards([]);
    const result = demo ? { ok: true as const, data: m.id === "demo-1" ? DEMO_PENDING : [] } : await getPendingRewards(m.id);
    if (result.ok) setPendingRewards(result.data);
  }

  async function redeem(reward: PendingReward) {
    setRedeemingId(reward.id);
    const result = demo ? ({ ok: true } as const) : await redeemReward(reward.id);
    setRedeemingId(null);
    if (!result.ok) return onError(result.error);
    setPendingRewards((list) => list.filter((r) => r.id !== reward.id));
  }

  return (
    <section aria-labelledby="step-member">
      <h2 id="step-member" className="mb-3 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
        Membre <span className="font-bold normal-case tracking-normal">(facultatif, pour créditer l&apos;XP)</span>
      </h2>

      {member ? (
        <div className="flex items-center gap-4 border-2 border-paper bg-charcoal p-4">
          <div className="grid size-12 shrink-0 place-items-center bg-paper font-display text-xl text-ink">
            {(member.username ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-paper">{member.username}</p>
            <p className="text-xs text-zinc-400">
              Niveau {member.level} · {formatXp(member.xp)} XP · {formatChf(member.current_season_spent)} CHF cette saison
              {member.is_premium_pass && <span className="ml-1 font-bold text-gold-ink">· Premium</span>}
            </p>
          </div>
          <button type="button" onClick={() => onChange(null)} aria-label="Retirer le membre" className="text-zinc-400 hover:text-paper">
            <X className="size-5" />
          </button>
        </div>
      ) : scanning ? (
        <div className="max-w-sm">
          <QrScanner onScan={onScan} onClose={() => setScanning(false)} />
          <p className="mt-2 text-xs text-zinc-400">Vise le QR code affiché dans « Mon profil » sur le téléphone du client.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <button type="button" onClick={() => setScanning(true)} className={`${primaryButton} shrink-0 py-3`}>
            <ScanLine className="size-5" /> Scanner la carte
          </button>
          <div className="min-w-0 flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim().length < 2) setResults([]);
                }}
                placeholder="… ou chercher par pseudo"
                aria-label="Chercher un membre par pseudo"
                className={`${inputClass} py-3 pl-9`}
              />
              {searching && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-zinc-400" />}
            </div>
            {results.length > 0 && (
              <ul className="mt-2 divide-y divide-zinc-800 border-2 border-zinc-700">
                {results.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => select(m)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-800"
                    >
                      <span className="font-bold text-paper">{m.username}</span>
                      <span className="text-xs text-zinc-400">niv. {m.level}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <p className="mt-2 text-sm text-zinc-400">Aucun membre trouvé.</p>
            )}
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {member && pendingRewards.length > 0 && (
          <motion.div
            key="pending-rewards"
            exit={{ opacity: 0, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
            className="mt-4 border-2 border-gold p-4"
          >
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-paper">
              <Gift className="size-4 text-gold-ink" /> Récompenses à remettre · {pendingRewards.length}
            </h3>
            <ul className="mt-3 divide-y divide-zinc-800">
              {/* initial={false} : la liste chargée ne s'anime pas ; seule la récompense remise s'efface. */}
              <AnimatePresence initial={false}>
                {pendingRewards.map((r) => (
                  <motion.li
                    key={r.id}
                    exit={{ opacity: 0, transform: reduceMotion ? "scale(1)" : "scale(0.98)" }}
                    transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center gap-3 py-2"
                  >
                    <RewardIcon icon={r.icon_name} className="size-5 shrink-0 text-gold-ink" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-paper">{r.reward}</span>
                      <span className="text-xs text-zinc-400">
                        Palier {r.tier_level} · {r.track === "premium" ? "Premium" : "Gratuit"}
                      </span>
                    </span>
                    <button type="button" onClick={() => redeem(r)} disabled={redeemingId === r.id} className={secondaryButton}>
                      {redeemingId === r.id ? <Loader2 className="size-4 animate-spin" /> : "Remettre"}
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
