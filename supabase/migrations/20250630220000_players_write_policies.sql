-- Politiques d'écriture pour le module Joueurs

create policy "Staff can insert players"
  on public.players for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'president', 'coach')
    )
  );

create policy "Staff can update players"
  on public.players for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'president', 'coach')
    )
  );

create policy "Staff can view all players"
  on public.players for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'president', 'coach', 'treasurer')
    )
  );
