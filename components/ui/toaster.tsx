"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  xp: "border-gold text-gold-ink",
  error: "border-torii text-paper",
  info: "border-paper text-paper",
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function Toaster({ toasts }: { toasts: Toast[] }) {
  const reduceMotion = useReducedMotion();
  // Entrée et sortie par le même bord (le haut) ; sortie plus rapide que l'entrée.
  const hidden = { opacity: 0, transform: reduceMotion ? "translateY(0px) scale(1)" : "translateY(-12px) scale(0.97)" };

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
            initial={hidden}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)", transition: { duration: 0.2, ease: EASE_OUT } }}
            exit={{ ...hidden, transition: { duration: 0.15, ease: EASE_OUT } }}
            className={`border-2 bg-ink px-4 py-2 text-sm font-bold shadow-panel ${TONES[t.tone ?? "info"]}`}
          >
            {t.title}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
