// Données locales utilisées tant que Supabase n'est pas configuré.
import { SEASON_LENGTH_DAYS, levelForXp } from "./game";
import { QUESTS, SEASON_1, SEASON_1_TIERS } from "./season-content";
import type { DashboardData } from "./data/dashboard";

const DAY = 24 * 60 * 60 * 1000;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export function getDemoDashboard(): DashboardData {
  const start = new Date(Date.now() - 12 * DAY);
  const seasonId = "demo-season-1";
  const xp = 3_420;

  const tiers = SEASON_1_TIERS.map((t) => ({ ...t, id: `demo-tier-${t.level}`, season_id: seasonId }));

  return {
    mode: "demo",
    profile: {
      id: "demo-user",
      username: "NeoOtaku",
      avatar_url: null,
      role: "client",
      xp,
      level: levelForXp(xp),
      current_season_spent: 18.5,
      is_premium_pass: false,
      created_at: start.toISOString(),
    },
    season: {
      id: seasonId,
      title: SEASON_1.title,
      start_date: isoDate(start),
      end_date: isoDate(new Date(start.getTime() + SEASON_LENGTH_DAYS * DAY)),
      is_active: true,
      created_at: start.toISOString(),
    },
    tiers,
    claimed: [
      { tier_id: "demo-tier-1", track: "free" },
      { tier_id: "demo-tier-3", track: "free" },
      { tier_id: "demo-tier-5", track: "free" },
    ],
    quests: QUESTS.map((q, i) => ({
      ...q,
      id: `demo-quest-${q.slug}`,
      progress: [1, 1, 8.5, 2][i] ?? 0,
      completed: false,
    })),
  };
}
