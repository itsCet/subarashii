-- =============================================================================
-- Remise des récompenses du Pass au comptoir.
-- Récompenses « physiques » (boisson, booster, goodies…) : le joueur les réclame
-- dans l'app, puis le staff les lui remet et les marque comme retirées.
-- Récompenses « numériques » (badge, titre, cadre…) : rien à retirer.
-- =============================================================================

alter table public.battle_pass_tiers
  add column if not exists free_redeemable    boolean not null default true,
  add column if not exists premium_redeemable boolean not null default true;

-- Même règle que `isDigitalReward` dans lib/season-content.ts.
update public.battle_pass_tiers
set free_redeemable = coalesce(free_reward, '') !~* '^(badge|titre|cadre de profil|fond d.écran|avatar)',
    premium_redeemable = coalesce(premium_reward, '') !~* '^(badge|titre|cadre de profil|fond d.écran|avatar)';

alter table public.user_rewards
  add column if not exists redeemed_at timestamptz,
  add column if not exists redeemed_by uuid references public.profiles (id) on delete set null;

-- Récompenses réclamées par le joueur connecté (page « Mon profil »).
create or replace function public.get_my_rewards ()
returns table (
  id          uuid,
  tier_level  integer,
  track       text,
  reward      text,
  icon_name   text,
  redeemable  boolean,
  claimed_at  timestamptz,
  redeemed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    ur.id, t.level, ur.track,
    case ur.track when 'premium' then t.premium_reward else t.free_reward end,
    case ur.track when 'premium' then t.icon_name else t.free_icon_name end,
    case ur.track when 'premium' then t.premium_redeemable else t.free_redeemable end,
    ur.claimed_at, ur.redeemed_at
  from public.user_rewards ur
  join public.battle_pass_tiers t on t.id = ur.tier_id
  where ur.user_id = auth.uid()
  order by ur.redeemed_at nulls first, t.level;
$$;

-- Récompenses physiques à remettre à un membre (caisse).
create or replace function public.get_pending_rewards (p_user_id uuid)
returns table (id uuid, tier_level integer, track text, reward text, icon_name text, claimed_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  return query
    select
      ur.id, t.level, ur.track,
      case ur.track when 'premium' then t.premium_reward else t.free_reward end,
      case ur.track when 'premium' then t.icon_name else t.free_icon_name end,
      ur.claimed_at
    from public.user_rewards ur
    join public.battle_pass_tiers t on t.id = ur.tier_id
    where ur.user_id = p_user_id
      and ur.redeemed_at is null
      and case ur.track when 'premium' then t.premium_redeemable else t.free_redeemable end
    order by t.level;
end;
$$;

-- Marque une récompense comme remise (une seule fois).
create or replace function public.redeem_reward (p_user_reward_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_redeemed_at timestamptz;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.user_rewards
  set redeemed_at = now(), redeemed_by = auth.uid()
  where id = p_user_reward_id and redeemed_at is null
  returning redeemed_at into v_redeemed_at;

  if v_redeemed_at is null then
    if exists (select 1 from public.user_rewards where id = p_user_reward_id) then
      raise exception 'ALREADY_REDEEMED' using errcode = '23505';
    end if;
    raise exception 'REWARD_NOT_FOUND' using errcode = 'P0002';
  end if;

  return v_redeemed_at;
end;
$$;

revoke execute on function public.get_my_rewards ()            from public, anon;
revoke execute on function public.get_pending_rewards (uuid)   from public, anon;
revoke execute on function public.redeem_reward (uuid)         from public, anon;
grant execute on function public.get_my_rewards ()             to authenticated;
grant execute on function public.get_pending_rewards (uuid)    to authenticated;
grant execute on function public.redeem_reward (uuid)          to authenticated;
