-- Équipe A — à exécuter quand la liste officielle sera disponible
-- Les joueurs Équipe A sont distincts des catégories U12 / U16 (formation).

/*
insert into public.players (...)
values
  -- ('Prénom', 'Nom', '+225...', 'team_a', 'Équipe A', ...);
*/

select 'Équipe A' as team, count(*) as total
from public.players
where team = 'Équipe A' and not is_archived;
