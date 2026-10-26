-- Fichier généré par scripts/bundle-sql.mts — ne pas éditer à la main.
-- Installation complète sur un projet Supabase VIDE : coller tout ce fichier dans
-- SQL Editor → New query → Run. (Une seule fois : il ne se relance pas sur une base déjà installée.)

begin;

-- =============================================================================
-- migrations/20261020000000_init.sql
-- =============================================================================

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

-- =============================================================================
-- migrations/20261021000000_events.sql
-- =============================================================================

-- =============================================================================
-- Agenda : événements du café et inscriptions (places limitées).
-- =============================================================================

create table public.events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null default '',
  category     text not null check (category in ('tcg', 'game_night', 'nocturne')),
  tag          text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  price_chf    numeric(6, 2) not null default 0 check (price_chf >= 0),
  conditions   text,
  capacity     integer check (capacity > 0), -- null = sans limite
  image_url    text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index events_starts_at_idx on public.events (starts_at) where is_published;

create table public.event_registrations (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- Événements à venir avec places restantes et statut d'inscription du joueur connecté.
create or replace function public.get_upcoming_events (p_limit integer default 50)
returns table (
  id            uuid,
  slug          text,
  title         text,
  description   text,
  category      text,
  tag           text,
  starts_at     timestamptz,
  ends_at       timestamptz,
  price_chf     numeric,
  conditions    text,
  capacity      integer,
  image_url     text,
  spots_left    integer,
  is_registered boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id, e.slug, e.title, e.description, e.category, e.tag, e.starts_at, e.ends_at,
    e.price_chf, e.conditions, e.capacity, e.image_url,
    case when e.capacity is null then null
         else greatest(e.capacity - (select count(*) from public.event_registrations r where r.event_id = e.id), 0)::integer
    end as spots_left,
    exists (
      select 1 from public.event_registrations r
      where r.event_id = e.id and r.user_id = auth.uid()
    ) as is_registered
  from public.events e
  where e.is_published and coalesce(e.ends_at, e.starts_at) >= now()
  order by e.starts_at
  limit least(greatest(p_limit, 1), 200);
$$;

create or replace function public.register_for_event (p_event_id uuid)
returns integer -- places restantes (null si illimité)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_taken integer;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  -- Verrou sur l'événement : deux inscriptions simultanées ne dépassent pas la capacité.
  select * into v_event from public.events where id = p_event_id and is_published for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_event.starts_at < now() then
    raise exception 'EVENT_STARTED' using errcode = '22023';
  end if;

  if exists (select 1 from public.event_registrations where event_id = p_event_id and user_id = auth.uid()) then
    raise exception 'ALREADY_REGISTERED' using errcode = '23505';
  end if;

  select count(*) into v_taken from public.event_registrations where event_id = p_event_id;
  if v_event.capacity is not null and v_taken >= v_event.capacity then
    raise exception 'EVENT_FULL' using errcode = '22023';
  end if;

  insert into public.event_registrations (event_id, user_id) values (p_event_id, auth.uid());

  return case when v_event.capacity is null then null else v_event.capacity - v_taken - 1 end;
end;
$$;

create or replace function public.cancel_event_registration (p_event_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.event_registrations where event_id = p_event_id and user_id = auth.uid();
$$;

alter table public.events              enable row level security;
alter table public.event_registrations enable row level security;

create policy "events_read" on public.events
  for select to anon, authenticated using (is_published or public.is_staff());
create policy "events_admin_write" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "event_registrations_select" on public.event_registrations
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

revoke execute on function public.register_for_event (uuid)        from public, anon;
revoke execute on function public.cancel_event_registration (uuid) from public, anon;
grant execute on function public.get_upcoming_events (integer)     to anon, authenticated;
grant execute on function public.register_for_event (uuid)         to authenticated;
grant execute on function public.cancel_event_registration (uuid)  to authenticated;

-- =============================================================================
-- migrations/20261022000000_profiles_backfill.sql
-- =============================================================================

-- =============================================================================
-- Profils joueurs : création robuste + rattrapage des comptes existants.
-- =============================================================================

-- Un pseudo de 1 caractère (ex: a@exemple.ch) violait la contrainte 2..24 et
-- faisait échouer l'inscription (« Database error saving new user »).
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := left(coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Otaku'
  ), 24);
begin
  if char_length(v_username) < 2 then
    v_username := 'Otaku-' || left(new.id::text, 4);
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, v_username, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Comptes créés avant l'installation du trigger : on leur crée un profil.
insert into public.profiles (id, username)
select
  u.id,
  case
    when char_length(left(split_part(u.email, '@', 1), 24)) >= 2 then left(split_part(u.email, '@', 1), 24)
    else 'Otaku-' || left(u.id::text, 4)
  end
from auth.users u
on conflict (id) do nothing;

-- =============================================================================
-- migrations/20261023000000_staff.sql
-- =============================================================================

-- =============================================================================
-- Espace staff : articles du shop, gestion de l'agenda par le personnel,
-- images (Supabase Storage) et historique de caisse.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Articles du shop
-- -----------------------------------------------------------------------------

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  category     text not null check (category in ('manga', 'tcg', 'goodies')),
  description  text not null default '',
  price_chf    numeric(8, 2) not null check (price_chf >= 0),
  stock        integer check (stock >= 0), -- null = stock non suivi
  image_url    text,
  is_new       boolean not null default false,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index products_published_idx on public.products (category, created_at desc) where is_published;

create or replace function public.touch_updated_at ()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

alter table public.products enable row level security;

create policy "products_read" on public.products
  for select to anon, authenticated using (is_published or public.is_staff());
create policy "products_staff_write" on public.products
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- Agenda : le personnel (caisse + admin) gère les événements
-- -----------------------------------------------------------------------------

drop policy "events_admin_write" on public.events;
create policy "events_staff_write" on public.events
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Liste des inscrits d'un événement (staff uniquement).
create or replace function public.get_event_registrations (p_event_id uuid)
returns table (user_id uuid, username text, registered_at timestamptz)
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
    select r.user_id, p.username, r.created_at
    from public.event_registrations r
    join public.profiles p on p.id = r.user_id
    where r.event_id = p_event_id
    order by r.created_at;
end;
$$;

-- Événements à venir ET passés récents, avec nombre d'inscrits (vue staff).
create or replace function public.get_staff_events ()
returns table (
  id            uuid,
  slug          text,
  title         text,
  description   text,
  category      text,
  tag           text,
  starts_at     timestamptz,
  ends_at       timestamptz,
  price_chf     numeric,
  conditions    text,
  capacity      integer,
  image_url     text,
  is_published  boolean,
  registrations integer
)
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
      e.id, e.slug, e.title, e.description, e.category, e.tag, e.starts_at, e.ends_at,
      e.price_chf, e.conditions, e.capacity, e.image_url, e.is_published,
      (select count(*) from public.event_registrations r where r.event_id = e.id)::integer
    from public.events e
    where coalesce(e.ends_at, e.starts_at) >= now() - interval '30 days'
    order by e.starts_at;
end;
$$;

-- -----------------------------------------------------------------------------
-- Caisse : derniers tickets enregistrés
-- -----------------------------------------------------------------------------

create or replace function public.get_recent_transactions (p_limit integer default 20)
returns table (
  id         uuid,
  created_at timestamptz,
  amount_chf numeric,
  xp_gained  integer,
  member     text,
  cashier    text
)
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
    select t.id, t.created_at, t.amount_chf, t.xp_gained, m.username, c.username
    from public.transactions t
    join public.profiles m on m.id = t.user_id
    left join public.profiles c on c.id = t.cashier_id
    order by t.created_at desc
    limit least(greatest(p_limit, 1), 100);
end;
$$;

revoke execute on function public.get_event_registrations (uuid)  from public, anon;
revoke execute on function public.get_staff_events ()              from public, anon;
revoke execute on function public.get_recent_transactions (integer) from public, anon;
grant execute on function public.get_event_registrations (uuid)   to authenticated;
grant execute on function public.get_staff_events ()               to authenticated;
grant execute on function public.get_recent_transactions (integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Images (affiches d'événements, photos d'articles) : bucket public « media »
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "media_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy "media_staff_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_staff());
create policy "media_staff_update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_staff());
create policy "media_staff_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_staff());

-- =============================================================================
-- migrations/20261024000000_reward_redemption.sql
-- =============================================================================

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

-- =============================================================================
-- migrations/20261025000000_orders.sql
-- =============================================================================

-- =============================================================================
-- Commandes : caisse staff avec panier, commande depuis l'app (payée au comptoir
-- ou en ligne). Les prix viennent TOUJOURS de la table products (jamais du client)
-- et le crédit d'XP passe par une seule fonction interne, credit_purchase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Catalogue : rayon « bar » (boissons, snacks) en plus de manga / tcg / goodies.
-- -----------------------------------------------------------------------------

alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check
  check (category in ('bar', 'manga', 'tcg', 'goodies'));

-- -----------------------------------------------------------------------------
-- Crédit d'XP partagé (caisse, commande remise, paiement en ligne).
-- Interne : n'est exécutable que par les autres fonctions (security definer).
-- -----------------------------------------------------------------------------

create or replace function public.credit_purchase (p_user_id uuid, p_amount_chf numeric, p_cashier_id uuid)
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
  values (p_user_id, p_cashier_id, v_season_id, v_amount, v_xp)
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

-- La caisse « montant libre » existante passe désormais par credit_purchase.
create or replace function public.record_transaction (p_user_id uuid, p_amount_chf numeric)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'SELF_TRANSACTION' using errcode = '42501';
  end if;
  return public.credit_purchase(p_user_id, p_amount_chf, auth.uid());
end;
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  number            bigint generated always as identity,
  user_id           uuid references public.profiles (id) on delete set null,
  source            text not null check (source in ('pos', 'app')),
  status            text not null default 'pending'
                      check (status in ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_method    text not null check (payment_method in ('counter', 'online')),
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  total_chf         numeric(10, 2) not null default 0 check (total_chf >= 0),
  note              text check (char_length(note) <= 200),
  transaction_id    uuid references public.transactions (id) on delete set null,
  handled_by        uuid references public.profiles (id) on delete set null,
  stripe_session_id text unique,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz,
  completed_at      timestamptz,
  cancelled_at      timestamptz
);

create index if not exists orders_open_idx on public.orders (created_at) where status in ('pending', 'preparing', 'ready');
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  name           text not null,                       -- copie au moment de la vente
  unit_price_chf numeric(8, 2) not null check (unit_price_chf >= 0),
  quantity       integer not null check (quantity between 1 and 99)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- Helpers internes
-- -----------------------------------------------------------------------------

-- Ajoute les lignes d'une commande, décrémente le stock, renvoie le total.
-- p_items = [{ "product_id": uuid, "quantity": int }]  (+ ligne libre { "name", "price_chf", "quantity" }
-- uniquement si p_allow_custom : caisse staff).
create or replace function public.add_order_items (p_order_id uuid, p_items jsonb, p_allow_custom boolean, p_published_only boolean)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item    jsonb;
  v_qty     integer;
  v_product public.products;
  v_price   numeric(10, 2);
  v_total   numeric(10, 2) := 0;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'TOO_MANY_ITEMS' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    if v_item ? 'product_id' and v_item ->> 'product_id' is not null then
      select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid
      for update;
      if not found or (p_published_only and not v_product.is_published) then
        raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0002';
      end if;
      if v_product.stock is not null and v_product.stock < v_qty then
        raise exception 'OUT_OF_STOCK' using errcode = '22023', detail = v_product.name;
      end if;
      if v_product.stock is not null then
        update public.products set stock = stock - v_qty where id = v_product.id;
      end if;
      insert into public.order_items (order_id, product_id, name, unit_price_chf, quantity)
      values (p_order_id, v_product.id, v_product.name, v_product.price_chf, v_qty);
      v_total := v_total + v_product.price_chf * v_qty;
    else
      if not p_allow_custom then
        raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0002';
      end if;
      v_price := round((v_item ->> 'price_chf')::numeric, 2);
      if v_price is null or v_price <= 0 or v_price > 10000 then
        raise exception 'INVALID_AMOUNT' using errcode = '22023';
      end if;
      insert into public.order_items (order_id, product_id, name, unit_price_chf, quantity)
      values (p_order_id, null, left(coalesce(nullif(trim(v_item ->> 'name'), ''), 'Montant libre'), 80), v_price, v_qty);
      v_total := v_total + v_price * v_qty;
    end if;
  end loop;

  if v_total <= 0 or v_total > 10000 then
    raise exception 'INVALID_AMOUNT' using errcode = '22023';
  end if;

  update public.orders set total_chf = v_total where id = p_order_id;
  return v_total;
end;
$$;

-- Remet en stock les articles d'une commande annulée.
create or replace function public.restock_order (p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.products p
  set stock = p.stock + i.qty
  from (
    select product_id, sum(quantity) as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) i
  where p.id = i.product_id and p.stock is not null;
$$;

-- Vue d'une commande (lignes comprises) renvoyée par les RPC.
create or replace function public.order_json (p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'user_id', o.user_id, 'username', p.username,
    'source', o.source, 'status', o.status, 'payment_method', o.payment_method,
    'payment_status', o.payment_status, 'total_chf', o.total_chf, 'note', o.note,
    'created_at', o.created_at, 'paid_at', o.paid_at, 'completed_at', o.completed_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', i.name, 'unit_price_chf', i.unit_price_chf, 'quantity', i.quantity, 'product_id', i.product_id
      ) order by i.name)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  left join public.profiles p on p.id = o.user_id
  where o.id = p_order_id;
$$;

-- -----------------------------------------------------------------------------
-- 1. Caisse staff : vente au comptoir, encaissée immédiatement.
-- -----------------------------------------------------------------------------

create or replace function public.pos_checkout (p_user_id uuid, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_total    numeric(10, 2);
  v_receipt  jsonb;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_user_id is not null and p_user_id = auth.uid() then
    raise exception 'SELF_TRANSACTION' using errcode = '42501';
  end if;

  insert into public.orders (user_id, source, status, payment_method, payment_status, handled_by, paid_at, completed_at)
  values (p_user_id, 'pos', 'completed', 'counter', 'paid', auth.uid(), now(), now())
  returning id into v_order_id;

  v_total := public.add_order_items(v_order_id, p_items, true, false);

  if p_user_id is not null then
    v_receipt := public.credit_purchase(p_user_id, v_total, auth.uid());
    update public.orders set transaction_id = (v_receipt ->> 'transaction_id')::uuid where id = v_order_id;
  end if;

  return jsonb_build_object('order', public.order_json(v_order_id), 'receipt', v_receipt);
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Commande depuis l'app (payée au comptoir ou en ligne).
-- -----------------------------------------------------------------------------

create or replace function public.place_order (p_items jsonb, p_note text, p_payment_method text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  if p_payment_method not in ('counter', 'online') then
    raise exception 'INVALID_PAYMENT_METHOD' using errcode = '22023';
  end if;
  -- Garde-fou anti-abus : 3 commandes en cours maximum par personne.
  if (select count(*) from public.orders
      where user_id = auth.uid() and status in ('pending', 'preparing', 'ready')) >= 3 then
    raise exception 'TOO_MANY_OPEN_ORDERS' using errcode = '22023';
  end if;

  insert into public.orders (user_id, source, status, payment_method, note)
  values (auth.uid(), 'app', 'pending', p_payment_method, nullif(left(trim(coalesce(p_note, '')), 200), ''))
  returning id into v_order_id;

  perform public.add_order_items(v_order_id, p_items, false, true);
  return public.order_json(v_order_id);
end;
$$;

-- Le client annule tant que rien n'est préparé ni payé.
create or replace function public.cancel_my_order (p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.status <> 'pending' or v_order.payment_status = 'paid' then
    raise exception 'ORDER_LOCKED' using errcode = '22023';
  end if;

  update public.orders set status = 'cancelled', cancelled_at = now() where id = p_order_id;
  perform public.restock_order(p_order_id);
  return public.order_json(p_order_id);
end;
$$;

-- Staff : avance une commande (en préparation, prête) ou l'annule.
create or replace function public.set_order_status (p_order_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status not in ('preparing', 'ready', 'cancelled') then
    raise exception 'INVALID_STATUS' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'ORDER_LOCKED' using errcode = '22023';
  end if;

  update public.orders
  set status = p_status,
      handled_by = auth.uid(),
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
  where id = p_order_id;

  if p_status = 'cancelled' then
    perform public.restock_order(p_order_id);
  end if;
  return public.order_json(p_order_id);
end;
$$;

-- Staff : commande remise au client. Encaisse si payée au comptoir, crédite les XP une seule fois.
create or replace function public.complete_order (p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders;
  v_receipt jsonb;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'ORDER_LOCKED' using errcode = '22023';
  end if;
  if v_order.payment_method = 'online' and v_order.payment_status <> 'paid' then
    raise exception 'NOT_PAID' using errcode = '22023';
  end if;

  if v_order.user_id is not null and v_order.transaction_id is null then
    if v_order.user_id = auth.uid() then
      raise exception 'SELF_TRANSACTION' using errcode = '42501';
    end if;
    v_receipt := public.credit_purchase(v_order.user_id, v_order.total_chf, auth.uid());
  end if;

  update public.orders
  set status = 'completed',
      payment_status = 'paid',
      paid_at = coalesce(paid_at, now()),
      completed_at = now(),
      handled_by = auth.uid(),
      transaction_id = coalesce(transaction_id, (v_receipt ->> 'transaction_id')::uuid)
  where id = p_order_id;

  return jsonb_build_object('order', public.order_json(p_order_id), 'receipt', v_receipt);
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Paiement en ligne (appelé par le webhook Stripe, clé service uniquement).
-- -----------------------------------------------------------------------------

create or replace function public.mark_order_paid (p_order_id uuid, p_session_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order   public.orders;
  v_receipt jsonb;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  -- Idempotent : Stripe peut renvoyer le même événement plusieurs fois.
  if v_order.payment_status = 'paid' then
    return public.order_json(p_order_id);
  end if;

  if v_order.user_id is not null and v_order.transaction_id is null then
    v_receipt := public.credit_purchase(v_order.user_id, v_order.total_chf, null);
  end if;

  -- Commande annulée entre-temps (stock déjà rendu) mais payée quand même : on la rouvre
  -- et on reprend le stock. Le client a payé : on honore la commande même si le stock est à 0.
  if v_order.status = 'cancelled' then
    update public.products p
    set stock = greatest(p.stock - i.qty, 0)
    from (
      select product_id, sum(quantity) as qty
      from public.order_items
      where order_id = p_order_id and product_id is not null
      group by product_id
    ) i
    where p.id = i.product_id and p.stock is not null;
  end if;

  update public.orders
  set payment_status = 'paid',
      paid_at = now(),
      stripe_session_id = p_session_id,
      -- Payée en ligne alors que le staff l'avait annulée entre-temps : on la rouvre.
      status = case when status = 'cancelled' then 'pending' else status end,
      cancelled_at = null,
      transaction_id = coalesce(transaction_id, (v_receipt ->> 'transaction_id')::uuid)
  where id = p_order_id;

  return public.order_json(p_order_id);
end;
$$;

-- Session Stripe expirée sans paiement : la commande est annulée et le stock rendu.
create or replace function public.expire_online_order (p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set status = 'cancelled', cancelled_at = now()
  where id = p_order_id and payment_status = 'unpaid' and status <> 'cancelled';
  if found then
    perform public.restock_order(p_order_id);
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Lecture
-- -----------------------------------------------------------------------------

-- Commandes en cours (staff) ou les miennes (client), avec lignes.
create or replace function public.get_orders (p_scope text default 'mine')
returns setof jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_scope = 'open' then
    if not public.is_staff() then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
    return query
      select public.order_json(o.id) from public.orders o
      where o.source = 'app'
        and (o.status in ('pending', 'preparing', 'ready')
             or (o.status in ('completed', 'cancelled') and coalesce(o.completed_at, o.cancelled_at) > now() - interval '2 hours'))
        -- Une commande en ligne non payée n'est pas encore à préparer.
        and not (o.payment_method = 'online' and o.payment_status = 'unpaid')
      order by o.created_at;
  else
    return query
      select public.order_json(o.id) from public.orders o
      where o.user_id = auth.uid() and o.source = 'app'
      order by o.created_at desc
      limit 20;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Sécurité
-- -----------------------------------------------------------------------------

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff()))
  );

-- Fonctions internes : jamais appelables directement depuis l'app.
revoke execute on function public.credit_purchase (uuid, numeric, uuid)            from public, anon, authenticated;
revoke execute on function public.add_order_items (uuid, jsonb, boolean, boolean)  from public, anon, authenticated;
revoke execute on function public.restock_order (uuid)                             from public, anon, authenticated;
revoke execute on function public.order_json (uuid)                                from public, anon, authenticated;
-- Réservées au webhook Stripe (clé service).
revoke execute on function public.mark_order_paid (uuid, text)                     from public, anon, authenticated;
revoke execute on function public.expire_online_order (uuid)                       from public, anon, authenticated;
grant execute on function public.mark_order_paid (uuid, text)                      to service_role;
grant execute on function public.expire_online_order (uuid)                        to service_role;

revoke execute on function public.pos_checkout (uuid, jsonb)          from public, anon;
revoke execute on function public.place_order (jsonb, text, text)     from public, anon;
revoke execute on function public.cancel_my_order (uuid)              from public, anon;
revoke execute on function public.set_order_status (uuid, text)       from public, anon;
revoke execute on function public.complete_order (uuid)               from public, anon;
revoke execute on function public.get_orders (text)                   from public, anon;
grant execute on function public.pos_checkout (uuid, jsonb)           to authenticated;
grant execute on function public.place_order (jsonb, text, text)      to authenticated;
grant execute on function public.cancel_my_order (uuid)               to authenticated;
grant execute on function public.set_order_status (uuid, text)        to authenticated;
grant execute on function public.complete_order (uuid)                to authenticated;
grant execute on function public.get_orders (text)                    to authenticated;

-- Temps réel : le staff voit arriver les commandes, le client suit la sienne.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;

-- =============================================================================
-- migrations/20261026000000_onboarding.sql
-- =============================================================================

-- =============================================================================
-- Onboarding : après la première connexion, le joueur choisit son pseudo et son
-- univers préférés (un ou plusieurs). Relançable sans risque (voir supabase/update.sql).
-- =============================================================================

alter table public.profiles
  add column if not exists favorite_universes text[] not null default '{}',
  add column if not exists onboarded_at       timestamptz;

alter table public.profiles drop constraint if exists profiles_favorite_universes_check;
alter table public.profiles add constraint profiles_favorite_universes_check
  check (favorite_universes <@ array['manga', 'tcg', 'gaming', 'bar']);

-- Première version (un seul univers) : on reprend le choix puis on retire l'ancienne colonne.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles' and column_name = 'favorite_universe') then
    update public.profiles set favorite_universes = array[favorite_universe]
    where favorite_universe is not null and favorite_universes = '{}';
    alter table public.profiles drop column favorite_universe;
  end if;
end;
$$;
drop function if exists public.complete_onboarding (text, text);

-- Le personnel n'a pas besoin de passer par l'accueil joueur.
update public.profiles set onboarded_at = now() where onboarded_at is null and role in ('cashier', 'admin');

create or replace function public.complete_onboarding (p_username text, p_universes text[])
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := btrim(p_username);
  v_profile  public.profiles;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  if v_username is null or char_length(v_username) not between 2 and 24 then
    raise exception 'INVALID_USERNAME' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_universes), 0) = 0
     or not (p_universes <@ array['manga', 'tcg', 'gaming', 'bar']) then
    raise exception 'INVALID_UNIVERSE' using errcode = '22023';
  end if;
  -- Pseudo unique (sans tenir compte des majuscules) : il s'affiche dans le classement.
  if exists (select 1 from public.profiles where lower(username) = lower(v_username) and id <> auth.uid()) then
    raise exception 'USERNAME_TAKEN' using errcode = '23505';
  end if;

  update public.profiles
  set username = v_username,
      favorite_universes = (select array_agg(distinct u order by u) from unnest(p_universes) u),
      onboarded_at = coalesce(onboarded_at, now())
  where id = auth.uid()
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke execute on function public.complete_onboarding (text, text[]) from public, anon;
grant execute on function public.complete_onboarding (text, text[]) to authenticated;

-- =============================================================================
-- seed.sql
-- =============================================================================

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
  (7, 3000, 'Sticker logo', 'Consommation offerte', 'cup-soda', 'sticker', true, true),
  (8, 3500, null, 'Bon shop 5 CHF', 'ticket', null, false, true),
  (9, 4000, '-10% sur un manga', 'Ramune offerte', 'cup-soda', 'percent', true, true),
  (10, 4500, 'Titre « Otaku Confirmé »', 'Tote bag Subarashii', 'shopping-bag', 'star', false, true),
  (11, 5000, null, 'Booster TCG', 'layers', null, false, true),
  (12, 5500, 'Boisson chaude offerte', 'Porte-clés acrylique', 'key-round', 'coffee', true, true),
  (13, 6000, null, 'Snack japonais offert', 'cookie', null, false, true),
  (14, 6500, 'Cadre de profil Néon', 'Boisson + snack offerts', 'gift', 'sparkles', false, true),
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

commit;
