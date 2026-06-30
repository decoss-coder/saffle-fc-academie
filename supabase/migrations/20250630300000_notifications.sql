-- Notifications in-app (parents + staff)

create type public.notification_type as enum (
  'absence',
  'late',
  'performance',
  'payment_overdue',
  'general'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  player_id uuid references public.players (id) on delete cascade,
  type public.notification_type not null default 'general',
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.convocation_entries
  add column if not exists performance_level text
  check (performance_level in ('excellent', 'satisfactory', 'needs_improvement'));

alter table public.notifications enable row level security;

create policy "Users view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users mark own notifications read"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.create_player_notifications(
  p_player_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text,
  p_link text default null,
  p_exclude_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select pg.guardian_id
    from public.player_guardians pg
    where pg.player_id = p_player_id
    union
    select pr.id
    from public.profiles pr
    where pr.role in ('admin', 'president', 'coach')
  loop
    if p_exclude_user_id is not null and v_user_id = p_exclude_user_id then
      continue;
    end if;

    insert into public.notifications (user_id, player_id, type, title, body, link)
    values (v_user_id, p_player_id, p_type, p_title, p_body, p_link);
  end loop;
end;
$$;

revoke all on function public.create_player_notifications(uuid, public.notification_type, text, text, text, uuid) from public;
grant execute on function public.create_player_notifications(uuid, public.notification_type, text, text, text, uuid) to authenticated;
