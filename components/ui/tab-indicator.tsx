"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Soulignement de l'onglet actif, partagé entre les onglets d'une même liste :
 * il glisse d'un onglet à l'autre (animation de mise en page = transform, GPU).
 * À placer dans un bouton `relative`. `layoutId` doit être unique par liste d'onglets.
 */
export function TabIndicator({ layoutId }: { layoutId: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      layoutId={layoutId}
      aria-hidden
      className="absolute inset-x-0 -bottom-px h-0.5 bg-torii"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    />
  );
}
