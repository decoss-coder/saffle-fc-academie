-- Corrige la récursion infinie RLS sur profiles

create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.get_my_role() from public;
grant execute on function public.get_my_role() to authenticated;

-- Profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Staff can view all profiles"
  on public.profiles for select
  using (public.get_my_role() in ('admin', 'president', 'treasurer'));

-- Players
drop policy if exists "Guardians can view linked players" on public.players;
create policy "Guardians can view linked players"
  on public.players for select
  using (
    exists (
      select 1 from public.player_guardians pg
      where pg.player_id = players.id and pg.guardian_id = auth.uid()
    )
    or user_id = auth.uid()
    or public.get_my_role() in ('admin', 'coach', 'treasurer', 'president')
  );

-- Player dues
drop policy if exists "View player dues" on public.player_dues;
create policy "View player dues"
  on public.player_dues for select
  using (
    exists (select 1 from public.players pl where pl.id = player_dues.player_id and pl.user_id = auth.uid())
    or exists (select 1 from public.player_guardians pg where pg.player_id = player_dues.player_id and pg.guardian_id = auth.uid())
    or public.get_my_role() in ('admin', 'treasurer', 'president')
  );

-- Payments
drop policy if exists "View payments" on public.payments;
create policy "View payments"
  on public.payments for select
  using (
    exists (select 1 from public.players pl where pl.id = payments.player_id and pl.user_id = auth.uid())
    or exists (select 1 from public.player_guardians pg where pg.player_id = payments.player_id and pg.guardian_id = auth.uid())
    or public.get_my_role() in ('admin', 'treasurer', 'president')
  );

-- Players write policies (idempotent)
drop policy if exists "Staff can insert players" on public.players;
drop policy if exists "Staff can update players" on public.players;
drop policy if exists "Staff can view all players" on public.players;

create policy "Staff can insert players"
  on public.players for insert
  with check (public.get_my_role() in ('admin', 'president', 'coach'));

create policy "Staff can update players"
  on public.players for update
  using (public.get_my_role() in ('admin', 'president', 'coach'));

create policy "Staff can view all players"
  on public.players for select
  using (public.get_my_role() in ('admin', 'president', 'coach', 'treasurer'));
