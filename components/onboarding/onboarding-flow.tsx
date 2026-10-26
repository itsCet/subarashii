"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Crown, Loader2, QrCode, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeOnboarding } from "@/app/actions/auth";
import { PREMIUM_THRESHOLD_CHF, XP_PER_CHF } from "@/lib/game";
import { UNIVERSES } from "@/lib/onboarding";
import type { Universe } from "@/lib/supabase/database.types";

type Props = { next: string; initialUsername: string; initialUniverse: Universe | null };

const STEPS = 3;
const EASE = [0.23, 1, 0.32, 1] as const;

export function OnboardingFlow({ next, initialUsername, initialUniverse }: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [username, setUsername] = useState(initialUsername);
  const [universe, setUniverse] = useState<Universe | null>(initialUniverse);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = username.trim();
  const canContinue = step === 0 ? name.length >= 2 && name.length <= 24 : step === 1 ? universe !== null : true;

  function go(to: number) {
    setError(null);
    setDirection(to > step ? 1 : -1);
    setStep(to);
  }

  async function onContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue || pending) return;
    if (step < STEPS - 1) return go(step + 1);

    setPending(true);
    const result = await completeOnboarding(name, universe!);
    if (!result.ok) {
      setPending(false);
      setError(result.error);
      // Pseudo refusé : retour à l'étape concernée.
      if (/pseudo/i.test(result.error)) go(0);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  const offset = reduceMotion ? 0 : 32;

  return (
    <form onSubmit={onContinue} className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-md flex-col">
      {/* Retour + progression */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          aria-label="Étape précédente"
          className="grid size-10 shrink-0 place-items-center border-2 border-zinc-700 text-paper transition-opacity hover:border-paper disabled:opacity-0"
        >
          <ChevronLeft className="size-5" />
        </button>
        <ol className="flex flex-1 gap-1.5" aria-label={`Étape ${step + 1} sur ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => (
            <li key={i} className="h-1.5 flex-1 overflow-hidden bg-zinc-800">
              <motion.span
                className="block h-full origin-left bg-torii"
                initial={false}
                animate={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="relative mt-10 flex-1">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, transform: `translateX(${direction * offset}px)` }}
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            exit={{ opacity: 0, transform: `translateX(${direction * -offset}px)`, transition: { duration: 0.12, ease: EASE } }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            {step === 0 && (
              <section>
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-torii-ink">Bienvenue au Suba ようこそ</p>
                <h1 className="mt-2 font-display text-3xl leading-tight text-paper">Comment doit-on t&apos;appeler ?</h1>
                <p className="mt-2 text-sm text-zinc-400">C&apos;est ton nom de joueur : il s&apos;affiche dans le classement.</p>
                <input
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={24}
                  autoComplete="nickname"
                  aria-label="Pseudo"
                  placeholder="Ton pseudo"
                  className="mt-8 w-full border-b-4 border-zinc-700 bg-transparent pb-2 font-display text-4xl text-paper outline-none placeholder:text-zinc-700 focus:border-torii"
                />
                <p className="mt-2 text-right text-xs tabular-nums text-zinc-400">{name.length}/24</p>
              </section>
            )}

            {step === 1 && (
              <section>
                <h1 className="font-display text-3xl leading-tight text-paper">Ton univers préféré au Suba ?</h1>
                <p className="mt-2 text-sm text-zinc-400">On s&apos;en sert pour te proposer les bons événements.</p>
                <div role="radiogroup" aria-label="Univers préféré" className="mt-8 grid grid-cols-2 gap-1.5 border-[6px] border-black bg-black">
                  {UNIVERSES.map((u) => {
                    const selected = universe === u.key;
                    return (
                      <button
                        key={u.key}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setUniverse(u.key)}
                        className={`relative flex min-h-36 flex-col justify-end overflow-hidden p-3 text-left transition-colors duration-150 ${
                          selected ? "bg-torii text-white" : "bg-charcoal text-paper hover:bg-zinc-800"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`absolute top-1 right-2 font-display text-5xl leading-none ${selected ? "text-white/30" : "text-zinc-800"}`}
                        >
                          {u.kanji}
                        </span>
                        <span className="relative font-extrabold">{u.label}</span>
                        <span className={`relative mt-0.5 text-xs ${selected ? "text-white/85" : "text-zinc-400"}`}>{u.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {step === 2 && (
              <section>
                <h1 className="font-display text-3xl leading-tight text-paper">Prêt·e, {name} ?</h1>
                <p className="mt-2 text-sm text-zinc-400">Ton Pass de Combat en 3 cases :</p>
                <ol className="mt-8 space-y-1.5 border-[6px] border-black bg-black">
                  <HowTo icon={<QrCode className="size-6" />} title="Montre ta carte membre en caisse">
                    Ton QR code est dans « Mon profil ».
                  </HowTo>
                  <HowTo icon={<Zap className="size-6" />} title={`1 CHF = ${XP_PER_CHF} XP`}>
                    Chaque achat te fait monter de niveau et débloque des récompenses.
                  </HowTo>
                  <HowTo icon={<Crown className="size-6" />} title={`Premium dès ${PREMIUM_THRESHOLD_CHF} CHF`}>
                    Cumulés sur la saison : la voie Premium s&apos;active toute seule.
                  </HowTo>
                </ol>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <p role="alert" className="mt-4 border-l-4 border-torii bg-torii/10 px-3 py-2 text-sm text-paper">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canContinue || pending}
        className="mt-6 flex w-full items-center justify-center gap-2 border-2 border-black bg-torii py-4 text-base font-extrabold uppercase tracking-wider text-white shadow-panel hover:bg-torii-strong disabled:opacity-50"
      >
        {pending && <Loader2 className="size-5 animate-spin" />}
        {step < STEPS - 1 ? "Continuer" : "C'est parti !"}
      </button>
    </form>
  );
}

function HowTo({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4 bg-paper p-4 text-ink">
      <span className="grid size-12 shrink-0 place-items-center bg-ink text-paper">{icon}</span>
      <span>
        <span className="block font-extrabold">{title}</span>
        <span className="text-sm text-zinc-700">{children}</span>
      </span>
    </li>
  );
}
