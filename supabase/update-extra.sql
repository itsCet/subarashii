-- ===== Paliers 7 et 14 : consommation au lieu du gaming (déjà gratuit) =====

update public.battle_pass_tiers t
set premium_reward = v.reward, icon_name = v.icon, premium_redeemable = true
from (values
  (7,  'Consommation offerte',    'cup-soda'),
  (14, 'Boisson + snack offerts', 'gift')
) as v(level, reward, icon)
where t.level = v.level
  and t.season_id = (select id from public.seasons where is_active);
