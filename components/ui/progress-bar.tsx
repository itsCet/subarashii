"use client";

import { motion } from "framer-motion";

type Props = {
  value: number; // 0 → 1
  tone?: "torii" | "gold";
  className?: string;
  label?: string;
};

const TONES = {
  torii: "from-torii to-dorayaki",
  gold: "from-dorayaki to-gold",
};

export function ProgressBar({ value, tone = "torii", className = "h-2.5", label }: Props) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`relative overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 ${className}`}
    >
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${TONES[tone]}`}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      />
    </div>
  );
}
