"use client";

import { useEffect, useState } from "react";

/** Heure courante, rafraîchie périodiquement. `null` pendant le rendu serveur (évite les écarts d'hydratation). */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
