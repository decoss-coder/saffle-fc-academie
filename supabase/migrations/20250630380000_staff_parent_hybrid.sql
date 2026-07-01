-- Staff / admin aussi parents : même numéro, rôle staff conservé, enfants liés via player_guardians

create or replace function public.link_guardian_children_by_phone(
  p_guardian_user_id uuid,
  p_phone text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  v_linked integer := 0;
begin
  if v_phone is null or p_guardian_user_id is null then
    return 0;
  end if;

  insert into public.player_guardians (player_id, guardian_id, relationship, is_primary)
  select p.id, p_guardian_user_id, 'parent', true
  from public.players p
  where public.normalize_phone(p.phone) = v_phone
    and not p.is_archived
  on conflict (player_id, guardian_id) do nothing;

  get diagnostics v_linked = row_count;
  return v_linked;
end;
$$;

revoke all on function public.link_guardian_children_by_phone(uuid, text) from public;
grant execute on function public.link_guardian_children_by_phone(uuid, text) to authenticated, service_role;

create or replace function public.sync_player_phone_registry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_name text;
  v_registry_role public.user_role;
  v_guardian_id uuid;
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

  select pr.role, pr.linked_user_id
  into v_registry_role, v_guardian_id
  from public.phone_registry pr
  where pr.phone_normalized = v_phone;

  if found and v_registry_role <> 'parent' then
    if v_guardian_id is not null then
      insert into public.player_guardians (player_id, guardian_id, relationship, is_primary)
      values (new.id, v_guardian_id, 'parent', true)
      on conflict (player_id, guardian_id) do nothing;
    end if;
    return new;
  end if;

  insert into public.phone_registry (phone_normalized, role, full_name, player_id)
  values (v_phone, 'parent', v_name, new.id)
  on conflict (phone_normalized) do update
    set
      full_name = coalesce(nullif(excluded.full_name, 'Parent'), phone_registry.full_name),
      player_id = coalesce(phone_registry.player_id, excluded.player_id),
      updated_at = now()
    where phone_registry.role = 'parent';

  select pr.linked_user_id
  into v_guardian_id
  from public.phone_registry pr
  where pr.phone_normalized = v_phone;

  if v_guardian_id is not null then
    insert into public.player_guardians (player_id, guardian_id, relationship, is_primary)
    values (new.id, v_guardian_id, 'parent', true)
    on conflict (player_id, guardian_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.ensure_parent_phone_for_player(p_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.players%rowtype;
  v_phone text;
  v_name text;
  v_registry_role public.user_role;
  v_guardian_id uuid;
  v_linked integer;
begin
  if public.get_my_role() not in ('admin', 'president', 'coach') then
    raise exception 'forbidden';
  end if;

  select * into v_player
  from public.players
  where id = p_player_id;

  if not found then
    raise exception 'player_not_found';
  end if;

  v_phone := public.normalize_phone(v_player.phone);
  if v_phone is null then
    return jsonb_build_object('ok', false, 'reason', 'no_phone');
  end if;

  v_name := coalesce(
    nullif(btrim(coalesce(v_player.guardian_name, '')), ''),
    nullif(btrim(coalesce(v_player.father_name, '')), ''),
    nullif(btrim(coalesce(v_player.mother_name, '')), ''),
    'Parent'
  );

  select pr.role, pr.linked_user_id
  into v_registry_role, v_guardian_id
  from public.phone_registry pr
  where pr.phone_normalized = v_phone;

  if found and v_registry_role <> 'parent' then
    if v_guardian_id is not null then
      insert into public.player_guardians (player_id, guardian_id, relationship, is_primary)
      values (p_player_id, v_guardian_id, 'parent', true)
      on conflict (player_id, guardian_id) do nothing;

      return jsonb_build_object(
        'ok', true,
        'phone', v_phone,
        'activated', true,
        'link_mode', 'staff_guardian',
        'registry_role', v_registry_role::text,
        'display_name', coalesce(v_player.guardian_name, v_player.father_name, v_player.mother_name)
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'phone', v_phone,
      'activated', false,
      'link_mode', 'staff_pending',
      'registry_role', v_registry_role::text,
      'display_name', v_name
    );
  end if;

  insert into public.phone_registry (phone_normalized, role, full_name, player_id)
  values (v_phone, 'parent', v_name, p_player_id)
  on conflict (phone_normalized) do update
    set
      full_name = coalesce(nullif(excluded.full_name, 'Parent'), phone_registry.full_name),
      player_id = coalesce(phone_registry.player_id, excluded.player_id),
      updated_at = now()
    where phone_registry.role = 'parent';

  select pr.linked_user_id
  into v_guardian_id
  from public.phone_registry pr
  where pr.phone_normalized = v_phone;

  if v_guardian_id is not null then
    insert into public.player_guardians (player_id, guardian_id, relationship, is_primary)
    values (p_player_id, v_guardian_id, 'parent', true)
    on conflict (player_id, guardian_id) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'phone', v_phone,
    'activated', v_guardian_id is not null,
    'link_mode', 'parent',
    'display_name', v_name
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

  perform public.link_guardian_children_by_phone(p_user_id, v_phone);
end;
$$;

-- Rétro-lien : enfants déjà en base avec le numéro d'un compte staff actif
insert into public.player_guardians (player_id, guardian_id, relationship, is_primary)
select p.id, pr.linked_user_id, 'parent', true
from public.players p
join public.phone_registry pr
  on pr.phone_normalized = public.normalize_phone(p.phone)
where pr.linked_user_id is not null
  and not p.is_archived
  and public.normalize_phone(p.phone) is not null
on conflict (player_id, guardian_id) do nothing;

drop policy if exists "Coaches can view parent phone registry" on public.phone_registry;
create policy "Staff can view phone registry for linking"
  on public.phone_registry for select
  using (public.get_my_role() in ('admin', 'president', 'coach'));
