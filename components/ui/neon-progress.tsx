"use client";

import { motion } from "framer-motion";

type Props = {
  value: number; // 0 → 1
  tone?: "violet" | "yellow";
  className?: string;
  label?: string;
};

const TONES = {
  violet: "from-neon-violet via-fuchsia-500 to-neon-pink shadow-[0_0_12px_rgba(236,72,153,0.6)]",
  yellow: "from-amber-400 via-cyber-yellow to-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.6)]",
};

export function NeonProgress({ value, tone = "violet", className = "h-2.5", label }: Props) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`relative overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-inset ring-white/5 ${className}`}
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
