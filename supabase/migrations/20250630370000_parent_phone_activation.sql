-- Accès parent : numéro fiche joueur → registre → activation / lien automatique

create or replace function public.sync_player_phone_registry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_name text;
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

  if exists (
    select 1
    from public.phone_registry pr
    where pr.phone_normalized = v_phone
      and pr.role <> 'parent'
  ) then
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
  where pr.phone_normalized = v_phone
    and pr.role = 'parent';

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
  v_guardian_id uuid;
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

  if exists (
    select 1
    from public.phone_registry pr
    where pr.phone_normalized = v_phone
      and pr.role <> 'parent'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'phone_is_staff');
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
  where pr.phone_normalized = v_phone
    and pr.role = 'parent';

  if v_guardian_id is not null then
    insert into public.player_guardians (player_id, guardian_id, relationship, is_primary)
    values (p_player_id, v_guardian_id, 'parent', true)
    on conflict (player_id, guardian_id) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'phone', v_phone,
    'activated', v_guardian_id is not null,
    'display_name', v_name
  );
end;
$$;

revoke all on function public.ensure_parent_phone_for_player(uuid) from public;
grant execute on function public.ensure_parent_phone_for_player(uuid) to authenticated;

drop policy if exists "Coaches can view parent phone registry" on public.phone_registry;
create policy "Coaches can view parent phone registry"
  on public.phone_registry for select
  using (
    public.get_my_role() in ('admin', 'president', 'coach')
    and role = 'parent'
  );
