-- Photos de profil joueurs (upload parent/joueur, visible staff)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-photos',
  'player-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.update_player_photo(
  p_player_id uuid,
  p_photo_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  if not public.can_access_player(p_player_id) then
    raise exception 'Accès refusé';
  end if;

  if public.get_my_role() not in (
    'parent',
    'player_formation',
    'player_team_a',
    'admin',
    'president',
    'coach'
  ) then
    raise exception 'Permission refusée';
  end if;

  if p_photo_path is null or btrim(p_photo_path) = '' then
    raise exception 'Chemin photo invalide';
  end if;

  if split_part(p_photo_path, '/', 1)::uuid <> p_player_id then
    raise exception 'Chemin photo invalide';
  end if;

  update public.players
  set photo_url = p_photo_path
  where id = p_player_id;
end;
$$;

revoke all on function public.update_player_photo(uuid, text) from public;
grant execute on function public.update_player_photo(uuid, text) to authenticated;

create policy "Upload player photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] is not null
    and public.can_access_player(((storage.foldername(name))[1])::uuid)
    and public.get_my_role() in (
      'parent',
      'player_formation',
      'player_team_a',
      'admin',
      'president',
      'coach'
    )
  );

create policy "View player photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] is not null
    and public.can_access_player(((storage.foldername(name))[1])::uuid)
  );

create policy "Replace player photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] is not null
    and public.can_access_player(((storage.foldername(name))[1])::uuid)
    and public.get_my_role() in (
      'parent',
      'player_formation',
      'player_team_a',
      'admin',
      'president',
      'coach'
    )
  )
  with check (
    bucket_id = 'player-photos'
    and (storage.foldername(name))[1] is not null
    and public.can_access_player(((storage.foldername(name))[1])::uuid)
  );
