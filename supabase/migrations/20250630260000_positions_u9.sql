-- Postes / catégories + libellé de fonction sur le registre téléphone

alter type public.player_category add value if not exists 'u9';

alter table public.phone_registry
  add column if not exists position_title text;

comment on column public.phone_registry.position_title is
  'Intitulé affiché (ex. Vice-président, Entraîneur équipe A)';

-- Staff avec poste : peut voir les convocations (directeur sportif, secrétaire)
create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Les postes « bureau élargi » peuvent consulter les joueurs
drop policy if exists "Staff can view all players" on public.players;
create policy "Staff can view all players"
  on public.players for select
  using (
    public.get_my_role() in (
      'admin', 'president', 'coach', 'treasurer', 'board', 'communication', 'logistics'
    )
  );
