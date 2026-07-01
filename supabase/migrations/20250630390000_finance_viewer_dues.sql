-- Lecteurs finance (bureau, communication, logistique) : consultation cotisations et paiements

drop policy if exists "View player dues" on public.player_dues;
create policy "View player dues"
  on public.player_dues for select
  using (
    exists (
      select 1 from public.players pl
      where pl.id = player_dues.player_id and pl.user_id = auth.uid()
    )
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = player_dues.player_id and pg.guardian_id = auth.uid()
    )
    or public.get_my_role() in (
      'admin', 'treasurer', 'president', 'coach',
      'board', 'communication', 'logistics'
    )
  );

drop policy if exists "View payments" on public.payments;
create policy "View payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.players pl
      where pl.id = payments.player_id and pl.user_id = auth.uid()
    )
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = payments.player_id and pg.guardian_id = auth.uid()
    )
    or public.get_my_role() in (
      'admin', 'treasurer', 'president',
      'board', 'communication', 'logistics'
    )
  );
