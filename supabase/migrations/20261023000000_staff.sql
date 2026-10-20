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
