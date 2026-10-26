-- =============================================================================
-- Onboarding : après la première connexion, le joueur choisit son pseudo et son
-- univers préféré. Relançable sans risque (voir supabase/update.sql).
-- =============================================================================

alter table public.profiles
  add column if not exists favorite_universe text,
  add column if not exists onboarded_at      timestamptz;

alter table public.profiles drop constraint if exists profiles_favorite_universe_check;
alter table public.profiles add constraint profiles_favorite_universe_check
  check (favorite_universe in ('manga', 'tcg', 'gaming', 'bar'));

-- Le personnel n'a pas besoin de passer par l'accueil joueur.
update public.profiles set onboarded_at = now() where onboarded_at is null and role in ('cashier', 'admin');

create or replace function public.complete_onboarding (p_username text, p_universe text)
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
  if p_universe not in ('manga', 'tcg', 'gaming', 'bar') then
    raise exception 'INVALID_UNIVERSE' using errcode = '22023';
  end if;
  -- Pseudo unique (sans tenir compte des majuscules) : il s'affiche dans le classement.
  if exists (select 1 from public.profiles where lower(username) = lower(v_username) and id <> auth.uid()) then
    raise exception 'USERNAME_TAKEN' using errcode = '23505';
  end if;

  update public.profiles
  set username = v_username,
      favorite_universe = p_universe,
      onboarded_at = coalesce(onboarded_at, now())
  where id = auth.uid()
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke execute on function public.complete_onboarding (text, text) from public, anon;
grant execute on function public.complete_onboarding (text, text) to authenticated;
