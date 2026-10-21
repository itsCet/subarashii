"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  value: number; // 0 → 1
  tone?: "torii" | "gold" | "ink";
  className?: string;
  label?: string;
};

const TONES = {
  torii: { track: "border-zinc-700 bg-zinc-900", fill: "bg-torii" },
  gold: { track: "border-zinc-700 bg-zinc-900", fill: "bg-gold" },
  ink: { track: "border-black bg-transparent", fill: "bg-black" },
};

export function ProgressBar({ value, tone = "torii", className = "h-2.5", label }: Props) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const reduceMotion = useReducedMotion();
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`relative overflow-hidden border ${TONES[tone].track} ${className}`}
    >
      {/* scaleX plutôt que width : pas de recalcul de mise en page à chaque image. */}
      <motion.div
        className={`h-full w-full origin-left ${TONES[tone].fill}`}
        initial={false}
        animate={{ transform: `scaleX(${pct / 100})` }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
      />
    </div>
  );
}
