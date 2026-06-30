-- Réorganisation : U12 (petits), U16 (grands), Équipe A réservée (liste à venir)
-- Exécuter dans Supabase SQL Editor.

-- Petits : ancien groupe U9-U10 → U12
update public.players
set
  team = 'U12',
  category = 'u12',
  birth_date = coalesce(nullif(birth_date, '2016-01-15'::date), '2014-01-15'::date)
where team in ('U9-U10', 'U12')
   or (category in ('u9', 'u10') and team is distinct from 'U16');

-- Grands + ancienne Équipe A → U16 (la vraie Équipe A sera importée plus tard)
update public.players
set
  team = 'U16',
  category = 'u16',
  birth_date = '2010-01-15'
where team = 'Équipe A'
   or category = 'team_a'
   or team = 'U14-U15';

-- Harmoniser les noms
update public.players
set first_name = 'Kouabi Emmanuel'
where first_name in ('Kouassi Emmanuel', 'Kouabi Emmanuel')
  and last_name = 'Kouassi'
  and team = 'U16';

update public.players
set first_name = 'Yoro', last_name = 'Tia'
where phone = '+2250546239699'
  and team = 'U16'
  and last_name ilike '%tia%';

-- Vérification
select team, category, count(*) as total
from public.players
where not is_archived
group by team, category
order by team;
