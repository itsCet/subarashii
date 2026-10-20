// Génère supabase/seed.sql à partir de lib/season-content.ts.
// Usage : npm run db:seed:generate
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { SEASON_LENGTH_DAYS } from "../lib/game";
import { SAMPLE_EVENTS } from "../lib/events-content";
import { QUESTS, SEASON_1, SEASON_1_TIERS } from "../lib/season-content";

const q = (v: string | number | null) =>
  v === null ? "null" : typeof v === "number" ? String(v) : `'${v.replaceAll("'", "''")}'`;

const tiers = SEASON_1_TIERS.map(
  (t) =>
    `  (${[t.level, t.xp_required, q(t.free_reward), q(t.premium_reward), q(t.icon_name), q(t.free_icon_name), t.free_redeemable, t.premium_redeemable].join(", ")})`,
).join(",\n");

const quests = QUESTS.map(
  (x) =>
    `  (${[q(x.slug), q(x.title), q(x.description), x.xp_reward, q(x.frequency), q(x.verification), x.target_value, q(x.icon_name), x.sort_order].join(", ")})`,
).join(",\n");

const events = SAMPLE_EVENTS.map((e) => {
  const start = `((current_date + ${e.day_offset}) + time '${e.time}') at time zone 'Europe/Zurich'`;
  return `  (${[q(e.slug), q(e.title), q(e.description), q(e.category), q(e.tag), start, `${start} + interval '${e.duration_min} minutes'`, e.price_chf, q(e.conditions), e.capacity ?? "null"].join(", ")})`;
}).join(",\n");

const sql = `-- Fichier généré par scripts/generate-seed.ts — ne pas éditer à la main.
-- Saison active de ${SEASON_LENGTH_DAYS} jours démarrant aujourd'hui, 30 paliers, quêtes et agenda d'exemple.

with season as (
  insert into public.seasons (title, start_date, end_date, is_active)
  values (${q(SEASON_1.title)}, current_date, current_date + ${SEASON_LENGTH_DAYS}, true)
  returning id
)
insert into public.battle_pass_tiers (season_id, level, xp_required, free_reward, premium_reward, icon_name, free_icon_name, free_redeemable, premium_redeemable)
select season.id, t.*
from season, (values
${tiers}
) as t (level, xp_required, free_reward, premium_reward, icon_name, free_icon_name, free_redeemable, premium_redeemable);

insert into public.quests (slug, title, description, xp_reward, frequency, verification, target_value, icon_name, sort_order)
values
${quests}
on conflict (slug) do nothing;

-- Événements d'exemple (agenda).
insert into public.events (slug, title, description, category, tag, starts_at, ends_at, price_chf, conditions, capacity)
values
${events}
on conflict (slug) do nothing;
`;

writeFileSync(join(import.meta.dirname, "..", "supabase", "seed.sql"), sql);
console.log("supabase/seed.sql généré");
