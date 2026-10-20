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
