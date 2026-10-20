// Contenu de la Saison 1. Source unique pour le mode démo et pour
// `supabase/seed.sql` (régénéré via `npm run db:seed:generate`).

import { MAX_TIER, xpForLevel } from "./game";

export const SEASON_1 = {
  title: "Saison 1 : Cyber Arcade",
};

type TierContent = {
  free: [reward: string, icon: string] | null;
  premium: [reward: string, icon: string];
};

const TIERS: TierContent[] = [
  { free: ["Badge Rookie", "badge"], premium: ["Avatar néon exclusif", "sparkles"] },
  { free: null, premium: ["Sticker Subarashii holo", "sticker"] },
  { free: ["Fond d'écran Cyber Arcade", "image"], premium: ["-20% sur une boisson", "cup-soda"] },
  { free: null, premium: ["Mochi glacé offert", "cookie"] },
  { free: ["Thé glacé offert", "cup-soda"], premium: ["Booster TCG au choix", "layers"] },
  { free: null, premium: ["Marque-page métal", "book-open"] },
  { free: ["Sticker logo", "sticker"], premium: ["1h de gaming offerte", "gamepad-2"] },
  { free: null, premium: ["Bon shop 5 CHF", "ticket"] },
  { free: ["-10% sur un manga", "percent"], premium: ["Ramune offerte", "cup-soda"] },
  { free: ["Titre « Otaku Confirmé »", "star"], premium: ["Tote bag Subarashii", "shopping-bag"] },
  { free: null, premium: ["Booster TCG", "layers"] },
  { free: ["Boisson chaude offerte", "coffee"], premium: ["Porte-clés acrylique", "key-round"] },
  { free: null, premium: ["Snack japonais offert", "cookie"] },
  { free: ["Cadre de profil Néon", "sparkles"], premium: ["2h de gaming offertes", "gamepad-2"] },
  { free: ["Booster TCG", "layers"], premium: ["Bon shop 10 CHF", "ticket"] },
  { free: null, premium: ["Pin's collector", "badge"] },
  { free: ["-15% sur un manga", "percent"], premium: ["Bubble tea offert", "cup-soda"] },
  { free: null, premium: ["Poster exclusif de saison", "image"] },
  { free: ["Sticker holo", "sticker"], premium: ["2 boosters TCG", "layers"] },
  { free: ["Titre « Légende d'Arcade »", "star"], premium: ["Mug Subarashii", "coffee"] },
  { free: null, premium: ["Manga tome 1 au choix", "book-open"] },
  { free: ["Boisson offerte", "cup-soda"], premium: ["Bon shop 15 CHF", "ticket"] },
  { free: null, premium: ["Snack box japonaise", "gift"] },
  { free: ["Cadre de profil Holo", "sparkles"], premium: ["Accès tournoi privé", "swords"] },
  { free: ["Booster TCG", "layers"], premium: ["T-shirt Subarashii", "shirt"] },
  { free: null, premium: ["Mini-figurine gacha", "gift"] },
  { free: ["-20% sur un manga", "percent"], premium: ["Bon shop 20 CHF", "ticket"] },
  { free: null, premium: ["-30% sur un display TCG", "layers"] },
  { free: ["Badge Saison 1", "badge"], premium: ["Coffret collector", "gem"] },
  { free: ["Titre « Maître du Café »", "crown"], premium: ["Figurine premium au choix", "trophy"] },
];

if (TIERS.length !== MAX_TIER) throw new Error(`La saison doit avoir ${MAX_TIER} paliers`);

export const SEASON_1_TIERS = TIERS.map((t, i) => ({
  level: i + 1,
  xp_required: xpForLevel(i + 1),
  free_reward: t.free?.[0] ?? null,
  free_icon_name: t.free?.[1] ?? null,
  premium_reward: t.premium[0],
  icon_name: t.premium[1],
}));

export const QUESTS = [
  {
    slug: "daily-checkin",
    title: "Check-in au café",
    description: "Connecte-toi à l'app aujourd'hui.",
    xp_reward: 50,
    frequency: "daily",
    verification: "self",
    target_value: 1,
    icon_name: "zap",
    sort_order: 1,
  },
  {
    slug: "daily-purchase",
    title: "Passage en caisse",
    description: "Fais scanner ta carte membre lors d'un achat.",
    xp_reward: 150,
    frequency: "daily",
    verification: "purchase",
    target_value: 1,
    icon_name: "scan-line",
    sort_order: 2,
  },
  {
    slug: "daily-spend-15",
    title: "Festin d'Otaku",
    description: "Dépense 15 CHF au café ou en boutique aujourd'hui.",
    xp_reward: 200,
    frequency: "daily",
    verification: "spend",
    target_value: 15,
    icon_name: "utensils",
    sort_order: 3,
  },
  {
    slug: "weekly-3-visits",
    title: "Habitué du quartier",
    description: "Passe en caisse 3 fois cette semaine.",
    xp_reward: 400,
    frequency: "weekly",
    verification: "purchase",
    target_value: 3,
    icon_name: "calendar-check",
    sort_order: 1,
  },
] as const;
