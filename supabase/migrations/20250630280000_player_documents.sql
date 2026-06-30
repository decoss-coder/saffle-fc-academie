-- Documents joueurs (dépôt parent/joueur, consultation staff)

create type public.document_status as enum (
  'pending',
  'approved',
  'rejected',
  'expired'
);

create table public.player_documents (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  uploaded_by uuid not null references auth.users (id) on delete set null,
  document_type text not null,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  status public.document_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index player_documents_player_idx on public.player_documents (player_id);
create index player_documents_status_idx on public.player_documents (status);
create index player_documents_type_idx on public.player_documents (document_type);

create or replace function public.can_access_player(p_player_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.players pl
    where pl.id = p_player_id
      and pl.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.player_guardians pg
    where pg.player_id = p_player_id
      and pg.guardian_id = auth.uid()
  )
  or public.get_my_role() in ('admin', 'president', 'coach', 'treasurer');
$$;

revoke all on function public.can_access_player(uuid) from public;
grant execute on function public.can_access_player(uuid) to authenticated;

create or replace function public.can_review_documents()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.get_my_role() in ('admin', 'president', 'coach');
$$;

revoke all on function public.can_review_documents() from public;
grant execute on function public.can_review_documents() to authenticated;

alter table public.player_documents enable row level security;

create policy "View player documents"
  on public.player_documents for select
  using (public.can_access_player(player_id));

create policy "Upload player documents"
  on public.player_documents for insert
  with check (
    public.can_access_player(player_id)
    and uploaded_by = auth.uid()
    and public.get_my_role() in ('parent', 'player_formation', 'player_team_a', 'admin', 'president', 'coach')
  );

create policy "Staff review player documents"
  on public.player_documents for update
  using (public.can_review_documents())
  with check (public.can_review_documents());

create trigger player_documents_updated_at
  before update on public.player_documents
  for each row
  execute function public.set_updated_at();

-- Storage bucket (privé, PDF + images, max 10 Mo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-documents',
  'player-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Upload player document files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'player-documents'
    and (storage.foldername(name))[1] is not null
    and public.can_access_player(((storage.foldername(name))[1])::uuid)
  );

create policy "View player document files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'player-documents'
    and (storage.foldername(name))[1] is not null
    and public.can_access_player(((storage.foldername(name))[1])::uuid)
  );

create policy "Replace own pending document files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'player-documents'
    and (storage.foldername(name))[1] is not null
    and public.can_access_player(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'player-documents'
    and (storage.foldername(name))[1] is not null
    and public.can_access_player(((storage.foldername(name))[1])::uuid)
  );
