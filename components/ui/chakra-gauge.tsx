"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  value: number; // 0 → 1
  steps?: number; // graduations (ex. 5 = tous les 5 CHF sur 25)
  label: string;
};

/**
 * Jauge « chakra » : l'énergie circule dans la barre et s'intensifie près du but.
 * La couleur passe du rouge torii à l'or ; le flux est coupé si l'utilisateur réduit les animations.
 */
export function ChakraGauge({ value, steps = 5, label }: Props) {
  const ratio = Math.min(Math.max(value, 0), 1);
  const pct = Math.round(ratio * 100);
  const reduceMotion = useReducedMotion();
  const charged = ratio >= 0.8;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="relative h-5 border-2 border-black bg-zinc-900"
    >
      <motion.div
        className={`absolute inset-0 origin-left overflow-hidden bg-gradient-to-r from-torii via-dorayaki to-gold ${
          charged ? "shadow-[0_0_14px_2px_var(--color-gold)]" : ""
        }`}
        initial={false}
        animate={{ transform: `scaleX(${ratio})` }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
      >
        {/* Flux d'énergie : bandes diagonales qui défilent (transform uniquement). */}
        <span
          aria-hidden
          className="chakra-flow absolute inset-y-0 left-0 w-[200%] opacity-40 motion-reduce:animate-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 10px, rgba(255,255,255,0.9) 10px 13px, transparent 13px 24px)",
            animationDuration: charged ? "0.9s" : "1.8s",
          }}
        />
      </motion.div>
      {/* Graduations */}
      {Array.from({ length: steps - 1 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-y-0 w-0.5 bg-black/60"
          style={{ left: `${((i + 1) / steps) * 100}%` }}
        />
      ))}
    </div>
  );
}
