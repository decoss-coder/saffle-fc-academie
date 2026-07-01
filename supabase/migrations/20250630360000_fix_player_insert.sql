-- Corrige l'enregistrement joueur : trigger téléphone + colonnes fédération (idempotent)

alter table public.players
  add column if not exists birth_name text,
  add column if not exists nationality text default 'Côte d''Ivoire',
  add column if not exists secondary_nationality text,
  add column if not exists birth_country text default 'Côte d''Ivoire',
  add column if not exists birth_region text,
  add column if not exists birth_city text,
  add column if not exists birth_certificate_ref text,
  add column if not exists former_license_number text;

create or replace function public.sync_player_phone_registry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_name text;
begin
  v_phone := public.normalize_phone(new.phone);

  if v_phone is null then
    return new;
  end if;

  v_name := coalesce(
    nullif(btrim(coalesce(new.guardian_name, '')), ''),
    nullif(btrim(coalesce(new.father_name, '')), ''),
    nullif(btrim(coalesce(new.mother_name, '')), ''),
    'Parent'
  );

  -- Ne pas écraser un numéro staff / bureau déjà enregistré
  if exists (
    select 1
    from public.phone_registry pr
    where pr.phone_normalized = v_phone
      and pr.role <> 'parent'
  ) then
    return new;
  end if;

  update public.phone_registry
  set
    full_name = coalesce(nullif(v_name, 'Parent'), phone_registry.full_name),
    player_id = coalesce(phone_registry.player_id, new.id),
    updated_at = now()
  where phone_normalized = v_phone
    and role = 'parent'
    and linked_user_id is null;

  if not found then
    insert into public.phone_registry (phone_normalized, role, full_name, player_id)
    values (v_phone, 'parent', v_name, new.id)
    on conflict (phone_normalized) do nothing;
  end if;

  return new;
end;
$$;
