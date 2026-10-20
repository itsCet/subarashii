-- Fichier généré par scripts/generate-seed.ts — ne pas éditer à la main.
-- Saison active de 90 jours démarrant aujourd'hui, 30 paliers, quêtes et agenda d'exemple.

with season as (
  insert into public.seasons (title, start_date, end_date, is_active)
  values ('Saison 1 : Cyber Arcade', current_date, current_date + 90, true)
  returning id
)
insert into public.battle_pass_tiers (season_id, level, xp_required, free_reward, premium_reward, icon_name, free_icon_name, free_redeemable, premium_redeemable)
select season.id, t.*
from season, (values
  (1, 0, 'Badge Rookie', 'Avatar néon exclusif', 'sparkles', 'badge', false, false),
  (2, 500, null, 'Sticker Subarashii holo', 'sticker', null, false, true),
  (3, 1000, 'Fond d''écran Cyber Arcade', '-20% sur une boisson', 'cup-soda', 'image', false, true),
  (4, 1500, null, 'Mochi glacé offert', 'cookie', null, false, true),
  (5, 2000, 'Thé glacé offert', 'Booster TCG au choix', 'layers', 'cup-soda', true, true),
  (6, 2500, null, 'Marque-page métal', 'book-open', null, false, true),
  (7, 3000, 'Sticker logo', '1h de gaming offerte', 'gamepad-2', 'sticker', true, true),
  (8, 3500, null, 'Bon shop 5 CHF', 'ticket', null, false, true),
  (9, 4000, '-10% sur un manga', 'Ramune offerte', 'cup-soda', 'percent', true, true),
  (10, 4500, 'Titre « Otaku Confirmé »', 'Tote bag Subarashii', 'shopping-bag', 'star', false, true),
  (11, 5000, null, 'Booster TCG', 'layers', null, false, true),
  (12, 5500, 'Boisson chaude offerte', 'Porte-clés acrylique', 'key-round', 'coffee', true, true),
  (13, 6000, null, 'Snack japonais offert', 'cookie', null, false, true),
  (14, 6500, 'Cadre de profil Néon', '2h de gaming offertes', 'gamepad-2', 'sparkles', false, true),
  (15, 7000, 'Booster TCG', 'Bon shop 10 CHF', 'ticket', 'layers', true, true),
  (16, 7500, null, 'Pin''s collector', 'badge', null, false, true),
  (17, 8000, '-15% sur un manga', 'Bubble tea offert', 'cup-soda', 'percent', true, true),
  (18, 8500, null, 'Poster exclusif de saison', 'image', null, false, true),
  (19, 9000, 'Sticker holo', '2 boosters TCG', 'layers', 'sticker', true, true),
  (20, 9500, 'Titre « Légende d''Arcade »', 'Mug Subarashii', 'coffee', 'star', false, true),
  (21, 10000, null, 'Manga tome 1 au choix', 'book-open', null, false, true),
  (22, 10500, 'Boisson offerte', 'Bon shop 15 CHF', 'ticket', 'cup-soda', true, true),
  (23, 11000, null, 'Snack box japonaise', 'gift', null, false, true),
  (24, 11500, 'Cadre de profil Holo', 'Accès tournoi privé', 'swords', 'sparkles', false, true),
  (25, 12000, 'Booster TCG', 'T-shirt Subarashii', 'shirt', 'layers', true, true),
  (26, 12500, null, 'Mini-figurine gacha', 'gift', null, false, true),
  (27, 13000, '-20% sur un manga', 'Bon shop 20 CHF', 'ticket', 'percent', true, true),
  (28, 13500, null, '-30% sur un display TCG', 'layers', null, false, true),
  (29, 14000, 'Badge Saison 1', 'Coffret collector', 'gem', 'badge', false, true),
  (30, 14500, 'Titre « Maître du Café »', 'Figurine premium au choix', 'trophy', 'crown', false, true)
) as t (level, xp_required, free_reward, premium_reward, icon_name, free_icon_name, free_redeemable, premium_redeemable);

insert into public.quests (slug, title, description, xp_reward, frequency, verification, target_value, icon_name, sort_order)
values
  ('daily-checkin', 'Check-in au café', 'Connecte-toi à l''app aujourd''hui.', 50, 'daily', 'self', 1, 'zap', 1),
  ('daily-purchase', 'Passage en caisse', 'Fais scanner ta carte membre lors d''un achat.', 150, 'daily', 'purchase', 1, 'scan-line', 2),
  ('daily-spend-15', 'Festin d''Otaku', 'Dépense 15 CHF au café ou en boutique aujourd''hui.', 200, 'daily', 'spend', 15, 'utensils', 3),
  ('weekly-3-visits', 'Habitué du quartier', 'Passe en caisse 3 fois cette semaine.', 400, 'weekly', 'purchase', 3, 'calendar-check', 1)
on conflict (slug) do nothing;

-- Événements d'exemple (agenda).
insert into public.events (slug, title, description, category, tag, starts_at, ends_at, price_chf, conditions, capacity)
values
  ('tournoi-one-piece', 'Tournoi One Piece TCG', 'Store tournament en rondes suisses, lots pour le top 4 et booster de participation.', 'tcg', 'One Piece', ((current_date + 3) + time '14:00') at time zone 'Europe/Zurich', ((current_date + 3) + time '14:00') at time zone 'Europe/Zurich' + interval '300 minutes', 10, 'Deck de 50 cartes + Leader, decklist à remettre à l''accueil', 32),
  ('soiree-loup-garou', 'Soirée Loup-Garou', 'Le village de Thiercelieux s''invite au café. Débutants bienvenus, un MJ anime chaque table.', 'game_night', 'Loup-Garou', ((current_date + 5) + time '19:30') at time zone 'Europe/Zurich', ((current_date + 5) + time '19:30') at time zone 'Europe/Zurich' + interval '180 minutes', 0, 'Gratuit avec une consommation', 18),
  ('quiz-manga-anime', 'Quiz Manga & Animé', 'Blind tests d''openings, questions shōnen, seinen et culture japonaise.', 'game_night', 'Quiz', ((current_date + 9) + time '20:00') at time zone 'Europe/Zurich', ((current_date + 9) + time '20:00') at time zone 'Europe/Zurich' + interval '150 minutes', 5, 'Par personne · équipes de 2 à 5', 40),
  ('tournoi-pokemon', 'Tournoi Pokémon TCG', 'Format Standard, ambiance conviviale, ouvert à tous les niveaux.', 'tcg', 'Pokémon', ((current_date + 11) + time '13:30') at time zone 'Europe/Zurich', ((current_date + 11) + time '13:30') at time zone 'Europe/Zurich' + interval '300 minutes', 10, 'Format Standard · decklist obligatoire', 24),
  ('before-kpop', 'Before K-Pop', 'Random play dance, playlist K-Pop et bubble tea avant de sortir.', 'nocturne', 'K-Pop', ((current_date + 13) + time '19:00') at time zone 'Europe/Zurich', ((current_date + 13) + time '19:00') at time zone 'Europe/Zurich' + interval '180 minutes', 0, 'Entrée libre', 60),
  ('yugioh-locals', 'Yu-Gi-Oh! Locals', 'Tournoi local en format Advanced, cartes promo à gagner.', 'tcg', 'Yu-Gi-Oh!', ((current_date + 17) + time '14:00') at time zone 'Europe/Zurich', ((current_date + 17) + time '14:00') at time zone 'Europe/Zurich' + interval '300 minutes', 8, 'Format Advanced · Konami ID requis', 24),
  ('soiree-jdr', 'Soirée JDR découverte', 'One-shot d''initiation au jeu de rôle dans un univers inspiré des mangas.', 'game_night', 'JDR', ((current_date + 20) + time '19:00') at time zone 'Europe/Zurich', ((current_date + 20) + time '19:00') at time zone 'Europe/Zurich' + interval '240 minutes', 15, 'Boisson incluse · aucune expérience requise', 10),
  ('nocturne-hip-hop', 'Nocturne Hip-Hop × Manga', 'DJ set hip-hop, lectures en accès libre et cocktails japonais jusqu''à tard.', 'nocturne', 'Hip-Hop', ((current_date + 24) + time '21:00') at time zone 'Europe/Zurich', ((current_date + 24) + time '21:00') at time zone 'Europe/Zurich' + interval '240 minutes', 10, 'Une boisson offerte', 80)
on conflict (slug) do nothing;
