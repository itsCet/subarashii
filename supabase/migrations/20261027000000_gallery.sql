-- =============================================================================
-- Galerie photos du café, gérée par le personnel (onglet Photos de /staff).
-- Relançable sans risque (voir supabase/update.sql).
-- =============================================================================

create table if not exists public.gallery_photos (
  id           uuid primary key default gen_random_uuid(),
  image_url    text not null,
  caption      text not null default '' check (char_length(caption) <= 120),
  area         text not null default 'cafe'
               check (area in ('cafe', 'bibliotheque', 'alcoves', 'bar', 'gaming', 'tcg', 'evenements')),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists gallery_photos_order_idx on public.gallery_photos (sort_order, created_at desc);

alter table public.gallery_photos enable row level security;

drop policy if exists "gallery_read" on public.gallery_photos;
create policy "gallery_read" on public.gallery_photos
  for select to anon, authenticated using (is_published or public.is_staff());

drop policy if exists "gallery_staff_write" on public.gallery_photos;
create policy "gallery_staff_write" on public.gallery_photos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
