-- Connexion par numéro de téléphone (parents via fiche joueur, staff via registre)

create table public.phone_registry (
  phone_normalized text primary key,
  role public.user_role not null,
  full_name text,
  player_id uuid references public.players (id) on delete set null,
  linked_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index phone_registry_linked_user_idx on public.phone_registry (linked_user_id);
create index phone_registry_role_idx on public.phone_registry (role);

create or replace function public.normalize_phone(raw text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  if raw is null or btrim(raw) = '' then
    return null;
  end if;

  digits := regexp_replace(raw, '[^0-9]', '', 'g');

  if length(digits) = 10 and digits like '0%' then
    digits := '225' || digits;
  elsif length(digits) = 13 and digits like '225%' then
    null;
  elsif length(digits) = 12 and digits like '225%' then
    null;
  end if;

  if length(digits) < 11 then
    return null;
  end if;

  return '+' || digits;
end;
$$;

create or replace function public.sync_player_phone_registry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  v_phone := public.normalize_phone(new.phone);

  if v_phone is null then
    return new;
  end if;

  insert into public.phone_registry (phone_normalized, role, full_name, player_id)
  values (
    v_phone,
    'parent',
    coalesce(nullif(btrim(new.guardian_name), ''), nullif(btrim(new.father_name), ''), nullif(btrim(new.mother_name), ''), 'Parent'),
    new.id
  )
  on conflict (phone_normalized) do update
    set
      full_name = coalesce(
        nullif(excluded.full_name, 'Parent'),
        phone_registry.full_name
      ),
      player_id = coalesce(phone_registry.player_id, excluded.player_id),
      updated_at = now()
  where phone_registry.role = 'parent'
    and phone_registry.linked_user_id is null;

  return new;
end;
$$;

create trigger players_sync_phone_registry
  after insert or update of phone, guardian_name, father_name, mother_name
  on public.players
  for each row
  execute function public.sync_player_phone_registry();

-- Rétro-remplissage depuis les joueurs existants
insert into public.phone_registry (phone_normalized, role, full_name, player_id)
select distinct on (public.normalize_phone(p.phone))
  public.normalize_phone(p.phone),
  'parent',
  coalesce(
    nullif(btrim(p.guardian_name), ''),
    nullif(btrim(p.father_name), ''),
    nullif(btrim(p.mother_name), ''),
    'Parent'
  ),
  p.id
from public.players p
where p.phone is not null
  and btrim(p.phone) <> ''
  and not p.is_archived
  and public.normalize_phone(p.phone) is not null
on conflict (phone_normalized) do nothing;

create or replace function public.check_phone_auth(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  v_row public.phone_registry%rowtype;
begin
  if v_phone is null then
    return jsonb_build_object('allowed', false, 'reason', 'invalid_phone');
  end if;

  select * into v_row
  from public.phone_registry
  where phone_normalized = v_phone;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'not_registered');
  end if;

  return jsonb_build_object(
    'allowed', true,
    'already_registered', v_row.linked_user_id is not null,
    'role', v_row.role::text,
    'display_name', coalesce(v_row.full_name, 'Utilisateur')
  );
end;
$$;

create or replace function public.complete_phone_activation(p_user_id uuid, p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  v_row public.phone_registry%rowtype;
begin
  if v_phone is null then
    raise exception 'invalid_phone';
  end if;

  select * into v_row
  from public.phone_registry
  where phone_normalized = v_phone;

  if not found then
    raise exception 'phone_not_registered';
  end if;

  if v_row.linked_user_id is not null and v_row.linked_user_id <> p_user_id then
    raise exception 'phone_already_linked';
  end if;

  update public.profiles
  set
    phone = v_phone,
    role = v_row.role,
    full_name = coalesce(
      nullif(btrim(full_name), ''),
      v_row.full_name,
      'Utilisateur'
    ),
    updated_at = now()
  where id = p_user_id;

  update public.phone_registry
  set linked_user_id = p_user_id, updated_at = now()
  where phone_normalized = v_phone;

  if v_row.role = 'parent' then
    insert into public.player_guardians (player_id, guardian_id, relationship, is_primary)
    select p.id, p_user_id, 'parent', true
    from public.players p
    where public.normalize_phone(p.phone) = v_phone
      and not p.is_archived
    on conflict (player_id, guardian_id) do nothing;
  end if;
end;
$$;

revoke all on function public.check_phone_auth(text) from public;
grant execute on function public.check_phone_auth(text) to anon, authenticated;

revoke all on function public.complete_phone_activation(uuid, text) from public;
grant execute on function public.complete_phone_activation(uuid, text) to service_role;

alter table public.phone_registry enable row level security;

create policy "Staff manage phone registry"
  on public.phone_registry for all
  using (public.get_my_role() in ('admin', 'president'))
  with check (public.get_my_role() in ('admin', 'president'));

create trigger phone_registry_updated_at
  before update on public.phone_registry
  for each row
  execute function public.set_updated_at();
