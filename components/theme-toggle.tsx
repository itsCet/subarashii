"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const THEME_STORAGE_KEY = "subarashii:theme";

/**
 * Script inline (dans <head>) : applique le thème avant le premier rendu pour éviter un flash.
 * Choix enregistré, sinon préférence du système, sinon sombre.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){}})()`;

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Sans choix enregistré, on suit les changements du système.
  const media = matchMedia("(prefers-color-scheme: light)");
  const onSystemChange = () => {
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY)) return;
    } catch {}
    document.documentElement.dataset.theme = media.matches ? "light" : "dark";
  };
  media.addEventListener("change", onSystemChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onSystemChange);
  };
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);

  function toggle() {
    const next: Theme = getTheme() === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }

  const label = theme === "light" ? "Passer en mode sombre" : "Passer en mode clair";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`grid size-10 shrink-0 place-items-center border-2 border-zinc-700 text-paper transition hover:border-paper ${className}`}
    >
      {/* Avant l'hydratation le thème est inconnu : on réserve la place sans icône. */}
      {theme === "light" ? <Moon className="size-5" /> : theme === "dark" ? <Sun className="size-5" /> : null}
    </button>
  );
}
