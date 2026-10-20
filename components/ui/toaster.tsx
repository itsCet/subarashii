"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";

export type Toast = { id: number; title: string; tone?: "xp" | "error" | "info" };

let nextId = 1;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((title: string, tone: Toast["tone"] = "info") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, title, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return { toasts, push };
}

const TONES = {
  xp: "border-cyber-yellow/50 text-cyber-yellow shadow-neon-yellow",
  error: "border-neon-pink/50 text-pink-200 shadow-neon-pink",
  info: "border-neon-violet/50 text-violet-100 shadow-neon-violet",
};

export function Toaster({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`rounded-xl border bg-slate-950/90 px-4 py-2 text-sm font-semibold backdrop-blur-md ${TONES[t.tone ?? "info"]}`}
          >
            {t.title}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
