-- =============================================================================
-- Subarashii Manga Café — schéma initial
-- Pass de Combat saisonnier, XP, quêtes, leaderboard, caisse.
--
-- Règles métier (miroir de lib/game.ts) :
--   * 1 CHF dépensé = 10 XP
--   * Niveau = floor(XP / 500) + 1
--   * Pass Premium débloqué dès que current_season_spent >= 25.00 CHF
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  username             text check (char_length(username) between 2 and 24),
  avatar_url           text,
  role                 text not null default 'client' check (role in ('client', 'cashier', 'admin')),
  xp                   integer not null default 0 check (xp >= 0),
  level                integer not null default 1 check (level >= 1),
  current_season_spent numeric(10, 2) not null default 0.00 check (current_season_spent >= 0),
  is_premium_pass      boolean not null default false,
  created_at           timestamptz not null default now()
);

create table public.seasons (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  start_date date not null,
  end_date   date not null,
  is_active  boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

-- Une seule saison active à la fois.
create unique index seasons_single_active on public.seasons (is_active) where is_active;

create table public.battle_pass_tiers (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references public.seasons (id) on delete cascade,
  level          integer not null check (level between 1 and 30),
  xp_required    integer not null check (xp_required >= 0),
  free_reward    text,
  premium_reward text,
  icon_name      text, -- icône du palier / de la récompense Premium (nom Lucide)
  free_icon_name text, -- icône de la récompense Gratuite (nom Lucide)
  unique (season_id, level)
);

-- `track` distingue la récompense de la voie Gratuite de celle de la voie Premium
-- d'un même palier (un palier peut donc être réclamé deux fois, une par voie).
create table public.user_rewards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  tier_id    uuid not null references public.battle_pass_tiers (id) on delete cascade,
  track      text not null default 'free' check (track in ('free', 'premium')),
  claimed_at timestamptz not null default now(),
  unique (user_id, tier_id, track)
);

create table public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  cashier_id uuid references public.profiles (id) on delete set null,
  season_id  uuid references public.seasons (id) on delete set null,
  amount_chf numeric(10, 2) not null check (amount_chf > 0 and amount_chf <= 10000),
  xp_gained  integer not null check (xp_gained >= 0),
  created_at timestamptz not null default now()
);

create index transactions_user_created_idx on public.transactions (user_id, created_at desc);

-- Quêtes quotidiennes / hebdomadaires.
--   verification = 'self'     → le joueur valide lui-même (ex: check-in)
--   verification = 'purchase' → nb de passages en caisse sur la période >= target_value
--   verification = 'spend'    → CHF dépensés sur la période >= target_value
create table public.quests (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null,
  xp_reward    integer not null check (xp_reward > 0),
  frequency    text not null check (frequency in ('daily', 'weekly')),
  verification text not null check (verification in ('self', 'purchase', 'spend')),
  target_value numeric(10, 2) not null default 1 check (target_value > 0),
  icon_name    text,
  is_active    boolean not null default true,
  sort_order   integer not null default 0
);

create table public.user_quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  quest_id     uuid not null references public.quests (id) on delete cascade,
  period_start date not null,
  completed_at timestamptz not null default now(),
  unique (user_id, quest_id, period_start)
);

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.level_for_xp (p_xp integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select (greatest(p_xp, 0) / 500) + 1;
$$;

create or replace function public.is_staff ()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('cashier', 'admin')
  );
$$;

create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Le café est à Genève : les journées / semaines de quêtes suivent l'heure locale.
create or replace function public.local_today ()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Zurich')::date;
$$;

create or replace function public.quest_period_start (p_frequency text)
returns date
language sql
stable
set search_path = ''
as $$
  select case p_frequency
    when 'weekly' then date_trunc('week', public.local_today())::date
    else public.local_today()
  end;
$$;

-- Le niveau est toujours dérivé de l'XP : aucune écriture ne peut les désynchroniser.
create or replace function public.sync_profile_level ()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.level := public.level_for_xp(new.xp);
  return new;
end;
$$;

create trigger profiles_sync_level
before insert or update of xp on public.profiles
for each row execute function public.sync_profile_level();

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Otaku'
    ), 24),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Logique métier (RPC)
-- -----------------------------------------------------------------------------

-- Enregistre un ticket de caisse : XP, cumul saison, déblocage du Pass Premium.
create or replace function public.record_transaction (p_user_id uuid, p_amount_chf numeric)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_amount      numeric(10, 2) := round(p_amount_chf, 2);
  v_xp          integer;
  v_season_id   uuid;
  v_before      public.profiles;
  v_after       public.profiles;
  v_transaction public.transactions;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'SELF_TRANSACTION' using errcode = '42501';
  end if;

  if v_amount is null or v_amount <= 0 or v_amount > 10000 then
    raise exception 'INVALID_AMOUNT' using errcode = '22023';
  end if;

  select * into v_before from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'MEMBER_NOT_FOUND' using errcode = 'P0002';
  end if;

  v_xp := floor(v_amount * 10)::integer;
  select id into v_season_id from public.seasons where is_active limit 1;

  insert into public.transactions (user_id, cashier_id, season_id, amount_chf, xp_gained)
  values (p_user_id, auth.uid(), v_season_id, v_amount, v_xp)
  returning * into v_transaction;

  update public.profiles
  set xp                   = xp + v_xp,
      current_season_spent = current_season_spent + v_amount,
      is_premium_pass      = is_premium_pass or (current_season_spent + v_amount >= 25.00)
  where id = p_user_id
  returning * into v_after;

  return jsonb_build_object(
    'transaction_id',       v_transaction.id,
    'user_id',              v_after.id,
    'username',             v_after.username,
    'amount_chf',           v_amount,
    'xp_gained',            v_xp,
    'xp',                   v_after.xp,
    'level_before',         v_before.level,
    'level',                v_after.level,
    'current_season_spent', v_after.current_season_spent,
    'is_premium_pass',      v_after.is_premium_pass,
    'premium_unlocked',     (not v_before.is_premium_pass and v_after.is_premium_pass)
  );
end;
$$;

-- Réclame la récompense d'un palier (voie gratuite ou premium) de la saison active.
create or replace function public.claim_reward (p_tier_id uuid, p_track text)
returns public.user_rewards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_tier    public.battle_pass_tiers;
  v_reward  public.user_rewards;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  if p_track not in ('free', 'premium') then
    raise exception 'INVALID_TRACK' using errcode = '22023';
  end if;

  select t.* into v_tier
  from public.battle_pass_tiers t
  join public.seasons s on s.id = t.season_id and s.is_active
  where t.id = p_tier_id;
  if not found then
    raise exception 'TIER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if (p_track = 'free' and v_tier.free_reward is null)
     or (p_track = 'premium' and v_tier.premium_reward is null) then
    raise exception 'NO_REWARD' using errcode = '22023';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();

  if v_profile.level < v_tier.level then
    raise exception 'LEVEL_TOO_LOW' using errcode = '42501';
  end if;

  if p_track = 'premium' and not v_profile.is_premium_pass then
    raise exception 'PREMIUM_REQUIRED' using errcode = '42501';
  end if;

  insert into public.user_rewards (user_id, tier_id, track)
  values (auth.uid(), p_tier_id, p_track)
  on conflict (user_id, tier_id, track) do nothing
  returning * into v_reward;

  if v_reward.id is null then
    raise exception 'ALREADY_CLAIMED' using errcode = '23505';
  end if;

  return v_reward;
end;
$$;

-- Progression d'un joueur sur une quête pour la période en cours.
create or replace function public.quest_progress (p_user_id uuid, p_quest public.quests)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select case p_quest.verification
    when 'self' then p_quest.target_value
    when 'purchase' then (
      select count(*)::numeric from public.transactions
      where user_id = p_user_id
        and (created_at at time zone 'Europe/Zurich')::date >= public.quest_period_start(p_quest.frequency)
    )
    when 'spend' then (
      select coalesce(sum(amount_chf), 0) from public.transactions
      where user_id = p_user_id
        and (created_at at time zone 'Europe/Zurich')::date >= public.quest_period_start(p_quest.frequency)
    )
    else 0
  end;
$$;

-- Quêtes actives + progression + statut pour le joueur connecté.
create or replace function public.get_my_quests ()
returns table (
  id           uuid,
  slug         text,
  title        text,
  description  text,
  xp_reward    integer,
  frequency    text,
  verification text,
  target_value numeric,
  icon_name    text,
  progress     numeric,
  completed    boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    q.id, q.slug, q.title, q.description, q.xp_reward, q.frequency,
    q.verification, q.target_value, q.icon_name,
    least(public.quest_progress(auth.uid(), q), q.target_value) as progress,
    exists (
      select 1 from public.user_quests uq
      where uq.user_id = auth.uid()
        and uq.quest_id = q.id
        and uq.period_start = public.quest_period_start(q.frequency)
    ) as completed
  from public.quests q
  where q.is_active and auth.uid() is not null
  order by q.frequency, q.sort_order;
$$;

-- Valide une quête et crédite l'XP au profil.
create or replace function public.complete_quest (p_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quest   public.quests;
  v_period  date;
  v_profile public.profiles;
  v_inserted uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  select * into v_quest from public.quests where id = p_quest_id and is_active;
  if not found then
    raise exception 'QUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  if public.quest_progress(auth.uid(), v_quest) < v_quest.target_value then
    raise exception 'QUEST_NOT_READY' using errcode = '42501';
  end if;

  v_period := public.quest_period_start(v_quest.frequency);

  insert into public.user_quests (user_id, quest_id, period_start)
  values (auth.uid(), p_quest_id, v_period)
  on conflict (user_id, quest_id, period_start) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    raise exception 'ALREADY_COMPLETED' using errcode = '23505';
  end if;

  update public.profiles
  set xp = xp + v_quest.xp_reward
  where id = auth.uid()
  returning * into v_profile;

  return jsonb_build_object(
    'quest_id',  p_quest_id,
    'xp_gained', v_quest.xp_reward,
    'xp',        v_profile.xp,
    'level',     v_profile.level
  );
end;
$$;

-- TOP N de la saison (lecture publique, sans exposer les autres colonnes du profil).
create or replace function public.get_leaderboard (p_limit integer default 10)
returns table (
  rank       bigint,
  id         uuid,
  username   text,
  avatar_url text,
  level      integer,
  xp         integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    row_number() over (order by p.xp desc, p.created_at asc) as rank,
    p.id, p.username, p.avatar_url, p.level, p.xp
  from public.profiles p
  where p.role = 'client'
  order by p.xp desc, p.created_at asc
  limit least(greatest(p_limit, 1), 100);
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.seasons           enable row level security;
alter table public.battle_pass_tiers enable row level security;
alter table public.user_rewards      enable row level security;
alter table public.transactions      enable row level security;
alter table public.quests            enable row level security;
alter table public.user_quests       enable row level security;

-- profiles : chacun lit son profil, le staff lit tout (recherche en caisse).
create policy "profiles_select_own_or_staff" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff());

-- Les joueurs ne peuvent modifier que leur pseudo / avatar (voir grants plus bas).
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Contenu de saison : lecture publique, écriture admin.
create policy "seasons_read" on public.seasons
  for select to anon, authenticated using (true);
create policy "seasons_admin_write" on public.seasons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "tiers_read" on public.battle_pass_tiers
  for select to anon, authenticated using (true);
create policy "tiers_admin_write" on public.battle_pass_tiers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "quests_read" on public.quests
  for select to anon, authenticated using (true);
create policy "quests_admin_write" on public.quests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Données joueur : lecture seule côté client, écriture uniquement via les RPC.
create policy "user_rewards_select" on public.user_rewards
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create policy "transactions_select" on public.transactions
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

create policy "user_quests_select" on public.user_quests
  for select to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

-- Empêche un joueur de s'auto-attribuer XP / rôle / pass via un UPDATE direct.
revoke update on public.profiles from authenticated, anon;
grant update (username, avatar_url) on public.profiles to authenticated;

revoke execute on function public.record_transaction (uuid, numeric) from public, anon;
revoke execute on function public.claim_reward (uuid, text)          from public, anon;
revoke execute on function public.complete_quest (uuid)              from public, anon;
revoke execute on function public.get_my_quests ()                   from public, anon;
revoke execute on function public.quest_progress (uuid, public.quests) from public, anon, authenticated;

grant execute on function public.record_transaction (uuid, numeric) to authenticated;
grant execute on function public.claim_reward (uuid, text)          to authenticated;
grant execute on function public.complete_quest (uuid)              to authenticated;
grant execute on function public.get_my_quests ()                   to authenticated;
grant execute on function public.get_leaderboard (integer)          to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Realtime : le client reçoit instantanément l'XP / le déblocage Premium
-- quand le caissier valide un ticket.
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.profiles;
