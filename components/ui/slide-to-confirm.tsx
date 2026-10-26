"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ChevronsRight, Loader2 } from "lucide-react";
import { useRef } from "react";

type Props = {
  label: string;
  onConfirm: () => void;
  pending?: boolean;
  disabled?: boolean;
  size?: "lg" | "sm";
};

const THRESHOLD = 0.85; // part du trajet à parcourir pour valider

/**
 * « Glisser pour confirmer » : évite les validations accidentelles sur la tablette de caisse.
 * Au clavier (Entrée / Espace sur la poignée), la validation est directe : le geste est déjà intentionnel.
 */
export function SlideToConfirm({ label, onConfirm, pending = false, disabled = false, size = "lg" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const knob = size === "lg" ? 56 : 40;
  const maxX = () => (trackRef.current ? trackRef.current.offsetWidth - knob - 8 : 0);
  // Le texte s'efface et la piste se remplit à mesure qu'on glisse.
  const labelOpacity = useTransform(x, (v) => 1 - Math.min(v / Math.max(maxX(), 1), 1) * 1.4);
  const fill = useTransform(x, (v) => `scaleX(${Math.min((v + knob) / ((trackRef.current?.offsetWidth ?? 1) - 8), 1)})`);
  const inactive = disabled || pending;

  function reset() {
    animate(x, 0, reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 });
  }

  function onDragEnd() {
    const max = maxX();
    if (max > 0 && x.get() >= max * THRESHOLD) {
      animate(x, max, { duration: reduceMotion ? 0 : 0.12 });
      onConfirm();
      // Revient en place une fois l'action lancée (le parent affiche le résultat).
      setTimeout(reset, 600);
    } else {
      reset();
    }
  }

  return (
    <div
      ref={trackRef}
      className={`relative flex items-center overflow-hidden border-2 border-black bg-zinc-900 p-1 shadow-panel select-none ${
        size === "lg" ? "h-16" : "h-12"
      } ${inactive ? "opacity-60" : ""}`}
    >
      <motion.div aria-hidden className="absolute inset-y-1 left-1 right-1 origin-left bg-torii/25" style={{ transform: fill }} />
      <motion.span
        aria-hidden
        style={{ opacity: labelOpacity }}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center pr-3 font-extrabold whitespace-nowrap text-paper ${
          size === "lg" ? "pl-16 text-base" : "pl-12 text-sm"
        }`}
      >
        <span className="truncate">{pending ? "Validation…" : label}</span>
      </motion.span>
      <motion.button
        type="button"
        aria-label={`${label} (glisser vers la droite)`}
        disabled={inactive}
        drag={inactive ? false : "x"}
        dragConstraints={trackRef}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !inactive) {
            e.preventDefault();
            onConfirm();
          }
        }}
        style={{ x, width: knob }}
        className="relative z-10 grid h-full shrink-0 cursor-grab touch-none place-items-center bg-torii text-white active:cursor-grabbing"
      >
        {pending ? <Loader2 className="size-5 animate-spin" /> : <ChevronsRight className="size-6" />}
      </motion.button>
    </div>
  );
}
