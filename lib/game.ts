// Règles métier du Pass de Combat — miroir exact des fonctions SQL
// (supabase/migrations/*_init.sql). Toute modification doit être faite des deux côtés.

export const XP_PER_CHF = 10;
export const XP_PER_LEVEL = 500;
export const PREMIUM_THRESHOLD_CHF = 25;
export const MAX_TIER = 30;
export const SEASON_LENGTH_DAYS = 90;

export function levelForXp(xp: number): number {
  return Math.floor(Math.max(xp, 0) / XP_PER_LEVEL) + 1;
}

export function xpForLevel(level: number): number {
  return (Math.max(level, 1) - 1) * XP_PER_LEVEL;
}

export function xpForAmount(amountChf: number): number {
  return Math.floor(roundChf(amountChf) * XP_PER_CHF);
}

export function roundChf(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Progression (0 → 1) vers le niveau suivant. */
export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const into = xp - xpForLevel(level);
  return { level, into, needed: XP_PER_LEVEL, ratio: into / XP_PER_LEVEL };
}

export function premiumProgress(spent: number) {
  const ratio = Math.min(spent / PREMIUM_THRESHOLD_CHF, 1);
  return { ratio, remaining: Math.max(roundChf(PREMIUM_THRESHOLD_CHF - spent), 0) };
}

export type TransactionOutcome = {
  xpGained: number;
  xp: number;
  levelBefore: number;
  level: number;
  currentSeasonSpent: number;
  isPremiumPass: boolean;
  premiumUnlocked: boolean;
};

/** Applique un ticket de caisse à un profil (même calcul que `record_transaction`). */
export function applyTransaction(
  profile: { xp: number; current_season_spent: number; is_premium_pass: boolean },
  amountChf: number,
): TransactionOutcome {
  const amount = roundChf(amountChf);
  const xpGained = xpForAmount(amount);
  const xp = profile.xp + xpGained;
  const currentSeasonSpent = roundChf(profile.current_season_spent + amount);
  const isPremiumPass = profile.is_premium_pass || currentSeasonSpent >= PREMIUM_THRESHOLD_CHF;
  return {
    xpGained,
    xp,
    levelBefore: levelForXp(profile.xp),
    level: levelForXp(xp),
    currentSeasonSpent,
    isPremiumPass,
    premiumUnlocked: !profile.is_premium_pass && isPremiumPass,
  };
}

export type Track = "free" | "premium";

export type RewardState = "claimed" | "claimable" | "locked" | "premium-locked" | "empty";

export function rewardState(args: {
  reward: string | null;
  track: Track;
  tierLevel: number;
  playerLevel: number;
  isPremium: boolean;
  claimed: boolean;
}): RewardState {
  if (!args.reward) return "empty";
  if (args.claimed) return "claimed";
  if (args.track === "premium" && !args.isPremium) return "premium-locked";
  if (args.playerLevel < args.tierLevel) return "locked";
  return "claimable";
}

export function formatChf(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatXp(xp: number): string {
  return new Intl.NumberFormat("fr-CH").format(xp);
}
