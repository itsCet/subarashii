import { redirect } from "next/navigation";
import type { Profile, Universe } from "./supabase/database.types";

export const UNIVERSES: { key: Universe; label: string; detail: string; kanji: string }[] = [
  { key: "manga", label: "Mangas", detail: "Lire en alcôve, découvrir des séries", kanji: "漫画" },
  { key: "tcg", label: "Cartes TCG", detail: "Tournois, boosters, decks", kanji: "札" },
  { key: "gaming", label: "Gaming", detail: "Consoles, rétro, soirées jeux", kanji: "遊" },
  { key: "bar", label: "Bar & snacks", detail: "Bubble tea, mochis, chill", kanji: "茶" },
];

/**
 * Premier passage : envoie le joueur sur l'accueil (pseudo + univers).
 * `onboarded_at === undefined` = migration pas encore appliquée : on ne bloque personne.
 */
export function requireOnboarding(profile: Profile | null, mode: "demo" | "live", next: string) {
  if (mode === "live" && profile && profile.onboarded_at === null) {
    redirect(`/bienvenue?next=${encodeURIComponent(next)}`);
  }
}
