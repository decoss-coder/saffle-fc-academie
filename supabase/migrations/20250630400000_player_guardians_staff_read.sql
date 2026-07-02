-- Lecture des liens parent ↔ enfant pour le staff (annuaire parents)

create policy "Guardians can view own links"
  on public.player_guardians
  for select
  to authenticated
  using (guardian_id = auth.uid());

create policy "Staff can view player guardians"
  on public.player_guardians
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'president', 'coach', 'treasurer')
    )
  );
