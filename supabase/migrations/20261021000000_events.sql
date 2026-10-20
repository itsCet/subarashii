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
