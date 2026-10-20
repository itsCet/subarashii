-- Fichier généré par scripts/generate-seed.ts — ne pas éditer à la main.
-- Saison active de 90 jours démarrant aujourd'hui, 30 paliers et quêtes.

with season as (
  insert into public.seasons (title, start_date, end_date, is_active)
  values ('Saison 1 : Cyber Arcade', current_date, current_date + 90, true)
  returning id
)
insert into public.battle_pass_tiers (season_id, level, xp_required, free_reward, premium_reward, icon_name, free_icon_name)
select season.id, t.*
from season, (values
  (1, 0, 'Badge Rookie', 'Avatar néon exclusif', 'sparkles', 'badge'),
  (2, 500, null, 'Sticker Subarashii holo', 'sticker', null),
  (3, 1000, 'Fond d''écran Cyber Arcade', '-20% sur une boisson', 'cup-soda', 'image'),
  (4, 1500, null, 'Mochi glacé offert', 'cookie', null),
  (5, 2000, 'Thé glacé offert', 'Booster TCG au choix', 'layers', 'cup-soda'),
  (6, 2500, null, 'Marque-page métal', 'book-open', null),
  (7, 3000, 'Sticker logo', '1h de gaming offerte', 'gamepad-2', 'sticker'),
  (8, 3500, null, 'Bon shop 5 CHF', 'ticket', null),
  (9, 4000, '-10% sur un manga', 'Ramune offerte', 'cup-soda', 'percent'),
  (10, 4500, 'Titre « Otaku Confirmé »', 'Tote bag Subarashii', 'shopping-bag', 'star'),
  (11, 5000, null, 'Booster TCG', 'layers', null),
  (12, 5500, 'Boisson chaude offerte', 'Porte-clés acrylique', 'key-round', 'coffee'),
  (13, 6000, null, 'Snack japonais offert', 'cookie', null),
  (14, 6500, 'Cadre de profil Néon', '2h de gaming offertes', 'gamepad-2', 'sparkles'),
  (15, 7000, 'Booster TCG', 'Bon shop 10 CHF', 'ticket', 'layers'),
  (16, 7500, null, 'Pin''s collector', 'badge', null),
  (17, 8000, '-15% sur un manga', 'Bubble tea offert', 'cup-soda', 'percent'),
  (18, 8500, null, 'Poster exclusif de saison', 'image', null),
  (19, 9000, 'Sticker holo', '2 boosters TCG', 'layers', 'sticker'),
  (20, 9500, 'Titre « Légende d''Arcade »', 'Mug Subarashii', 'coffee', 'star'),
  (21, 10000, null, 'Manga tome 1 au choix', 'book-open', null),
  (22, 10500, 'Boisson offerte', 'Bon shop 15 CHF', 'ticket', 'cup-soda'),
  (23, 11000, null, 'Snack box japonaise', 'gift', null),
  (24, 11500, 'Cadre de profil Holo', 'Accès tournoi privé', 'swords', 'sparkles'),
  (25, 12000, 'Booster TCG', 'T-shirt Subarashii', 'shirt', 'layers'),
  (26, 12500, null, 'Mini-figurine gacha', 'gift', null),
  (27, 13000, '-20% sur un manga', 'Bon shop 20 CHF', 'ticket', 'percent'),
  (28, 13500, null, '-30% sur un display TCG', 'layers', null),
  (29, 14000, 'Badge Saison 1', 'Coffret collector', 'gem', 'badge'),
  (30, 14500, 'Titre « Maître du Café »', 'Figurine premium au choix', 'trophy', 'crown')
) as t (level, xp_required, free_reward, premium_reward, icon_name, free_icon_name);

insert into public.quests (slug, title, description, xp_reward, frequency, verification, target_value, icon_name, sort_order)
values
  ('daily-checkin', 'Check-in au café', 'Connecte-toi à l''app aujourd''hui.', 50, 'daily', 'self', 1, 'zap', 1),
  ('daily-purchase', 'Passage en caisse', 'Fais scanner ta carte membre lors d''un achat.', 150, 'daily', 'purchase', 1, 'scan-line', 2),
  ('daily-spend-15', 'Festin d''Otaku', 'Dépense 15 CHF au café ou en boutique aujourd''hui.', 200, 'daily', 'spend', 15, 'utensils', 3),
  ('weekly-3-visits', 'Habitué du quartier', 'Passe en caisse 3 fois cette semaine.', 400, 'weekly', 'purchase', 3, 'calendar-check', 1)
on conflict (slug) do nothing;
