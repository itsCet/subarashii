"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

const COLORS = ["#e63946", "#e9c46a", "#f4a261", "#f6c9d4", "#f4f4f5"];
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type Props = {
  open: boolean;
  rewardsReady: number;
  onClose: () => void;
};

export function PremiumUnlockedOverlay({ open, rewardsReady, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  // Entrée des textes : décalage de 50 ms, montée courte (aucune montée si mouvement réduit).
  const enter = (delay: number) => ({
    initial: { opacity: 0, transform: reduceMotion ? "translateY(0px)" : "translateY(8px)" },
    animate: { opacity: 1, transform: "translateY(0px)" },
    transition: { duration: 0.3, delay, ease: EASE_OUT },
  });
  // Positions pseudo-aléatoires mais stables pour les confettis.
  const confetti = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * Math.PI * 2;
        const distance = 140 + ((i * 53) % 160);
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotate: (i * 97) % 360,
          color: COLORS[i % COLORS.length],
          delay: (i % 6) * 0.03,
        };
      }),
    [],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-unlocked-title"
          className="fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-black/85 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          onClick={onClose}
        >
          {/* Halo fixe : la lumière suffit, la rotation infinie n'apportait rien. */}
          <div
            aria-hidden
            className="absolute size-[42rem] rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(233,196,106,0.25),transparent_30%,rgba(230,57,70,0.25),transparent_60%,rgba(246,201,212,0.2),transparent)]"
          />

          <div className="relative flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
            {/* Célébration rare : confettis autorisés, en `transform` complet (accéléré GPU). */}
            {!reduceMotion &&
              confetti.map((c, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute top-24 h-3 w-1.5 rounded-sm"
                  style={{ backgroundColor: c.color }}
                  initial={{ opacity: 1, transform: "translate(0px, 0px) rotate(0deg) scale(0.6)" }}
                  animate={{
                    opacity: 0,
                    transform: `translate(${c.x}px, ${c.y + 120}px) rotate(${c.rotate + 360}deg) scale(1)`,
                  }}
                  transition={{ duration: 1.6, delay: 0.15 + c.delay, ease: EASE_OUT }}
                />
              ))}

            <motion.div
              initial={{ opacity: 0, transform: reduceMotion ? "scale(1)" : "scale(0.9)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
              className="relative"
            >
              <Image
                src="/brand/logo.png"
                alt=""
                width={192}
                height={192}
                className="rounded-full border-4 border-black"
              />
              <span className="absolute -top-3 left-1/2 grid size-12 -translate-x-1/2 place-items-center rounded-sm bg-gold text-black">
                <Crown className="size-7" />
              </span>
            </motion.div>

            <motion.h2
              id="premium-unlocked-title"
              className="mt-8 font-display text-3xl leading-tight text-gold sm:text-4xl"
              {...enter(0.15)}
            >
              PASS PREMIUM DÉBLOQUÉ ! 🎉
            </motion.h2>
            <motion.p
              className="mt-3 max-w-sm text-white/80"
              {...enter(0.2)}
            >
              {rewardsReady > 0
                ? `${rewardsReady} récompense${rewardsReady > 1 ? "s" : ""} Premium ${rewardsReady > 1 ? "sont" : "est"} déjà réclamable${rewardsReady > 1 ? "s" : ""}.`
                : "La voie Premium est ouverte pour toute la saison."}
            </motion.p>
            <motion.button
              type="button"
              onClick={onClose}
              className="mt-8 rounded-sm bg-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-dorayaki"
              {...enter(0.25)}
              autoFocus
            >
              Voir mes récompenses
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
