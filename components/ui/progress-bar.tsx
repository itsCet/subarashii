"use client";

import { motion } from "framer-motion";

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
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`relative overflow-hidden border ${TONES[tone].track} ${className}`}
    >
      <motion.div
        className={`h-full ${TONES[tone].fill}`}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      />
    </div>
  );
}
