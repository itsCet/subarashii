-- Remise à zéro après une phase de test (à coller dans Supabase → SQL Editor → Run).
-- Conserve : comptes, pseudos, rôles staff, articles, événements, saison et paliers.
-- Efface : commandes, tickets de caisse, XP, cumul de saison, Pass Premium,
--          récompenses réclamées et progression des quêtes.

begin;

-- 1. Remet en rayon le stock des commandes non annulées (sinon il reste décompté).
update public.products p
set stock = p.stock + i.qty
from (
  select oi.product_id, sum(oi.quantity) as qty
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status <> 'cancelled' and oi.product_id is not null
  group by oi.product_id
) i
where p.id = i.product_id and p.stock is not null;

-- 2. Commandes (les lignes partent avec) et tickets de caisse.
delete from public.orders;
delete from public.transactions;

-- 3. Les numéros de commande repartent à 1.
alter table public.orders alter column number restart with 1;

-- 4. Progression des joueurs.
delete from public.user_rewards;
delete from public.user_quests;
update public.profiles
set xp = 0, current_season_spent = 0, is_premium_pass = false;  -- le niveau repasse à 1 automatiquement

commit;
