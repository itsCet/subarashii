"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

const COLORS = ["#e63946", "#e9c46a", "#f4a261", "#f6c9d4", "#f4f4f5"];

type Props = {
  open: boolean;
  rewardsReady: number;
  onClose: () => void;
};

export function PremiumUnlockedOverlay({ open, rewardsReady, onClose }: Props) {
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
          onClick={onClose}
        >
          <motion.div
            aria-hidden
            className="absolute size-[42rem] rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(233,196,106,0.25),transparent_30%,rgba(230,57,70,0.25),transparent_60%,rgba(246,201,212,0.2),transparent)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
            {confetti.map((c, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute top-24 h-3 w-1.5 rounded-sm"
                style={{ backgroundColor: c.color }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
                animate={{ x: c.x, y: c.y + 120, opacity: 0, rotate: c.rotate + 360, scale: 1 }}
                transition={{ duration: 1.6, delay: 0.25 + c.delay, ease: "easeOut" }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 14 }}
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
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              PASS PREMIUM DÉBLOQUÉ ! 🎉
            </motion.h2>
            <motion.p
              className="mt-3 max-w-sm text-zinc-300"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {rewardsReady > 0
                ? `${rewardsReady} récompense${rewardsReady > 1 ? "s" : ""} Premium ${rewardsReady > 1 ? "sont" : "est"} déjà réclamable${rewardsReady > 1 ? "s" : ""}.`
                : "La voie Premium est ouverte pour toute la saison."}
            </motion.p>
            <motion.button
              type="button"
              onClick={onClose}
              className="mt-8 rounded-sm bg-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-dorayaki active:scale-95"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65 }}
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
