"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Crown, Gift, Loader2, ScanLine, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type MemberSummary,
  type TransactionReceipt,
  findMembers,
  getPendingRewards,
  recordTransaction,
  redeemReward,
} from "@/app/actions/staff";
import { RewardIcon } from "@/components/ui/reward-icon";
import { PREMIUM_THRESHOLD_CHF, applyTransaction, formatChf, formatXp } from "@/lib/game";
import type { PendingReward, RecentTransaction } from "@/lib/supabase/database.types";
import { formatDateTimeShort } from "@/lib/time";
import { inputClass, primaryButton, secondaryButton } from "./form";
import { QrScanner } from "./qr-scanner";

const QUICK_AMOUNTS = [5, 10, 15, 20, 25];

const DEMO_PENDING: PendingReward[] = [
  { id: "demo-r1", tier_level: 5, track: "free", reward: "Thé glacé offert", icon_name: "cup-soda", claimed_at: "" },
  { id: "demo-r2", tier_level: 4, track: "premium", reward: "Mochi glacé offert", icon_name: "cookie", claimed_at: "" },
];

const DEMO_MEMBERS: MemberSummary[] = [
  { id: "demo-1", username: "NeoOtaku", avatar_url: null, xp: 3420, level: 7, current_season_spent: 18.5, is_premium_pass: false },
  { id: "demo-2", username: "Sakura_92", avatar_url: null, xp: 6100, level: 13, current_season_spent: 41, is_premium_pass: true },
  { id: "demo-3", username: "Luffy-GE", avatar_url: null, xp: 120, level: 1, current_season_spent: 4, is_premium_pass: false },
];

type Props = {
  mode: "demo" | "live";
  initialTransactions: RecentTransaction[];
};

export function Checkout({ mode, initialTransactions }: Props) {
  const demo = mode === "demo";
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [history, setHistory] = useState(initialTransactions);
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
      else setError(result.error);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, demo]);

  async function onScan(text: string) {
    setScanning(false);
    setError(null);
    const result = demo ? { ok: true as const, data: [DEMO_MEMBERS[0]] } : await findMembers(text);
    if (!result.ok) return setError(result.error);
    if (result.data.length === 0) return setError("QR code non reconnu : ce n'est pas une carte membre Subarashii.");
    selectMember(result.data[0]);
  }

  async function selectMember(m: MemberSummary) {
    setMember(m);
    setQuery("");
    setResults([]);
    setError(null);
    setPendingRewards([]);
    const result = demo ? { ok: true as const, data: m.id === "demo-1" ? DEMO_PENDING : [] } : await getPendingRewards(m.id);
    if (result.ok) setPendingRewards(result.data);
  }

  async function redeem(reward: PendingReward) {
    setRedeemingId(reward.id);
    const result = demo ? ({ ok: true } as const) : await redeemReward(reward.id);
    setRedeemingId(null);
    if (!result.ok) return setError(result.error);
    setPendingRewards((list) => list.filter((r) => r.id !== reward.id));
  }

  function reset() {
    setMember(null);
    setPendingRewards([]);
    setAmount("");
    setReceipt(null);
    setError(null);
  }

  const value = Number(amount.replace(",", "."));
  const validAmount = Number.isFinite(value) && value > 0 && value <= 10_000;
  const preview = member && validAmount ? applyTransaction(member, value) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!member || !validAmount) return;
    setPending(true);
    setError(null);

    let result: { ok: true; data: TransactionReceipt } | { ok: false; error: string };
    if (demo) {
      const o = applyTransaction(member, value);
      result = {
        ok: true,
        data: {
          username: member.username,
          amount_chf: value,
          xp_gained: o.xpGained,
          xp: o.xp,
          level_before: o.levelBefore,
          level: o.level,
          current_season_spent: o.currentSeasonSpent,
          is_premium_pass: o.isPremiumPass,
          premium_unlocked: o.premiumUnlocked,
        },
      };
    } else {
      result = await recordTransaction(member.id, value);
    }
    setPending(false);

    if (!result.ok) return setError(result.error);
    setReceipt(result.data);
    setHistory((h) =>
      [
        {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          amount_chf: result.data.amount_chf,
          xp_gained: result.data.xp_gained,
          member: result.data.username,
          cashier: "toi",
        },
        ...h,
      ].slice(0, 15),
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        {receipt ? (
          <Receipt receipt={receipt} onNext={reset} />
        ) : (
          <>
            {/* Étape 1 : membre */}
            <section aria-labelledby="step-member">
              <h2 id="step-member" className="mb-3 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
                1 · Membre
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
                  <button type="button" onClick={reset} aria-label="Changer de membre" className="text-zinc-400 hover:text-paper">
                    <X className="size-5" />
                  </button>
                </div>
              ) : scanning ? (
                <div className="max-w-sm">
                  <QrScanner onScan={onScan} onClose={() => setScanning(false)} />
                  <p className="mt-2 text-xs text-zinc-400">Vise le QR code affiché dans « Mon profil » sur le téléphone du client.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button type="button" onClick={() => setScanning(true)} className={`${primaryButton} w-full py-4 text-base sm:w-auto`}>
                    <ScanLine className="size-5" /> Scanner la carte membre
                  </button>
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
                      className={`${inputClass} pl-9`}
                    />
                    {searching && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-zinc-400" />}
                  </div>
                  {results.length > 0 && (
                    <ul className="divide-y divide-zinc-800 border-2 border-zinc-700">
                      {results.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => selectMember(m)}
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
                    <p className="text-sm text-zinc-400">Aucun membre trouvé.</p>
                  )}
                </div>
              )}
            </section>

            <AnimatePresence initial={false}>
            {member && pendingRewards.length > 0 && (
              <motion.section
                key="pending-rewards"
                exit={{ opacity: 0, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
                aria-labelledby="pending-rewards" className="mt-6 border-2 border-gold p-4">
                <h2 id="pending-rewards" className="flex items-center gap-2 text-sm font-extrabold text-paper">
                  <Gift className="size-4 text-gold-ink" /> Récompenses à remettre · {pendingRewards.length}
                </h2>
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
                      <button
                        type="button"
                        onClick={() => redeem(r)}
                        disabled={redeemingId === r.id}
                        className={secondaryButton}
                      >
                        {redeemingId === r.id ? <Loader2 className="size-4 animate-spin" /> : "Remettre"}
                      </button>
                    </motion.li>
                  ))}
                  </AnimatePresence>
                </ul>
              </motion.section>
            )}
            </AnimatePresence>

            {/* Étape 2 : montant */}
            <form onSubmit={submit} aria-labelledby="step-amount" className={`mt-8 ${member ? "" : "pointer-events-none opacity-40"}`}>
              <h2 id="step-amount" className="mb-3 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
                2 · Montant du ticket
              </h2>
              <div className="flex items-stretch border-2 border-zinc-700 focus-within:border-paper">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="0.00"
                  aria-label="Montant en CHF"
                  disabled={!member}
                  className="w-full bg-ink px-4 py-4 font-display text-4xl text-paper outline-none placeholder:text-zinc-700"
                />
                <span className="grid place-items-center bg-zinc-800 px-4 font-extrabold text-zinc-300">CHF</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((a) => (
                  <button key={a} type="button" onClick={() => setAmount(String(a))} disabled={!member} className={secondaryButton}>
                    {a}
                  </button>
                ))}
              </div>

              {preview && member && (
                <div className="mt-4 border-l-4 border-gold bg-gold/10 px-4 py-3 text-sm text-paper">
                  <strong>+{formatXp(preview.xpGained)} XP</strong>
                  {preview.level > preview.levelBefore && <> · passe niveau {preview.level}</>} · cumul saison{" "}
                  {formatChf(member.current_season_spent)} → {formatChf(preview.currentSeasonSpent)} CHF
                  {preview.premiumUnlocked && (
                    <p className="mt-1 font-extrabold text-gold-ink">Ce ticket débloque le Pass Premium !</p>
                  )}
                  {!preview.isPremiumPass && (
                    <p className="mt-1 text-xs text-zinc-400">
                      Pass Premium à {formatChf(PREMIUM_THRESHOLD_CHF)} CHF cumulés.
                    </p>
                  )}
                </div>
              )}

              <button type="submit" disabled={!member || !validAmount || pending} className={`${primaryButton} mt-5 w-full py-4 text-base`}>
                {pending && <Loader2 className="size-5 animate-spin" />}
                Valider le ticket
              </button>
            </form>
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 border-l-4 border-torii bg-torii/10 px-3 py-2 text-sm text-paper">
            {error}
          </p>
        )}
      </div>

      <aside aria-labelledby="history-title">
        <h2 id="history-title" className="mb-3 text-sm font-extrabold uppercase tracking-wider text-zinc-400">
          Derniers tickets
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-400">Aucun ticket enregistré pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 text-sm">
            {history.map((t) => (
              <li key={t.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-bold text-paper">{t.member}</span>
                  <span className="text-xs text-zinc-400">
                    {formatDateTimeShort(t.created_at)} · {t.cashier}
                  </span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  <span className="block text-paper">{formatChf(t.amount_chf)}</span>
                  <span className="text-xs text-gold-ink">+{t.xp_gained} XP</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Receipt({ receipt, onNext }: { receipt: TransactionReceipt; onNext: () => void }) {
  return (
    <section aria-live="polite" className="border-[6px] border-black bg-paper p-6 text-ink transition duration-200 ease-snappy starting:scale-[0.97] starting:opacity-0 motion-reduce:starting:scale-100">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center bg-emerald-500 text-white">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Ticket validé</p>
          <p className="font-display text-2xl leading-tight">{receipt.username}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="border-2 border-black p-3">
          <dt className="text-xs font-bold uppercase text-zinc-400">Montant</dt>
          <dd className="font-display text-xl">{formatChf(receipt.amount_chf)}</dd>
        </div>
        <div className="border-2 border-black p-3">
          <dt className="text-xs font-bold uppercase text-zinc-400">XP</dt>
          <dd className="font-display text-xl">+{formatXp(receipt.xp_gained)}</dd>
        </div>
        <div className="border-2 border-black p-3">
          <dt className="text-xs font-bold uppercase text-zinc-400">Niveau</dt>
          <dd className="font-display text-xl">
            {receipt.level}
            {receipt.level > receipt.level_before && <span className="text-sm text-torii-ink-inv"> ↑</span>}
          </dd>
        </div>
      </dl>

      {receipt.premium_unlocked && (
        <p className="mt-4 flex items-center gap-2 border-2 border-black bg-gold px-4 py-3 font-extrabold">
          <Crown className="size-5" /> Pass Premium débloqué ! Préviens le client.
        </p>
      )}
      <p className="mt-4 text-sm text-zinc-700">
        Cumul saison : {formatChf(receipt.current_season_spent)} CHF · {formatXp(receipt.xp)} XP au total.
      </p>

      <button
        type="button"
        onClick={onNext}
        autoFocus
        className="mt-6 w-full border-2 border-black bg-ink py-4 text-base font-extrabold text-paper hover:bg-black"
      >
        Ticket suivant
      </button>
    </section>
  );
}
