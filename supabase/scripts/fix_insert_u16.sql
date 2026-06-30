-- Complète les U16 manquants et retire les grands du groupe U12
-- À exécuter si vous n'avez que des joueurs U12 (ex. 21) après fix_teams_u12_u16.sql

-- 1. Déplacer les grands encore classés en U12
update public.players
set
  team = 'U16',
  category = 'u16',
  birth_date = '2010-01-15'
where team = 'U12'
  and (
    (first_name = 'Japhet David' and last_name = 'Kouassi')
    or (first_name in ('Kouassi Emmanuel', 'Kouabi Emmanuel') and last_name = 'Kouassi')
    or (first_name = 'Andre Samuel' and last_name = 'Gbagbo')
    or (first_name = 'Gedeon' and last_name = 'Gnandé Têhi')
    or (first_name = 'Yoro Alaman' and last_name = 'Tia')
    or (first_name = 'Yoro' and last_name = 'Tia')
  );

update public.players
set first_name = 'Kouabi Emmanuel'
where last_name = 'Kouassi'
  and first_name in ('Kouassi Emmanuel', 'Kouabi Emmanuel')
  and team = 'U16';

-- 2. Insérer les grands U16 absents de la base
do $$
declare
  v_matricule text;
  v_counter int := (
    select count(*)::int from public.players where matricule like 'SFA-2026-%'
  );
  rec record;
begin
  for rec in
    select * from (
      values
        ('Japhet David', 'Kouassi', '+2250747610599', 'M'),
        ('Kouabi Emmanuel', 'Kouassi', '+2250747610599', 'M'),
        ('Andre Samuel', 'Gbagbo', '+2250707798224', 'M'),
        ('Gedeon', 'Gnandé Têhi', '+2250564001094', 'M'),
        ('Sinaly', 'Coulibaly', '+2250707732032', 'M'),
        ('Eli', 'Kramon Bi', '+2250555683721', 'M'),
        ('Youniqué', 'Coulibaly', '+2250506807604', 'M'),
        ('Adramane', 'Coulibaly', '+2250544332432', 'M'),
        ('Yoro', 'Tia', '+2250546239699', 'M'),
        ('Dramane', 'Traoré', '+2250555524900', 'M'),
        ('Mediba', 'Bakayoko', '+2250505164467', 'M'),
        ('Abdoulaye', 'Koné', '+2250707899131', 'M'),
        ('Lassinan', 'Sidibé', '+2250504482699', 'M'),
        ('Ahmed', 'Coulibaly', '+2250546919587', 'M'),
        ('Sabrina', 'Affissou', '+2250757118275', 'F'),
        ('Agoua', 'Kouame', '+2250708997755', 'M'),
        ('Ismaël', 'Coulibaly', '+2250506446393', 'M'),
        ('Alousseni', 'Ballo', '+2250505616025', 'M'),
        ('Guipa', 'Nioble', '+2250757393961', 'M'),
        ('Mohamed', 'Fofana', '+2250554103629', 'M'),
        ('David', 'Tchoko', '+2250747299493', 'M'),
        ('Isaac', 'Dogbo', '+2250749997778', 'M'),
        ('Simon', 'Kouassi', '+2250505755250', 'M')
    ) as t(first_name, last_name, phone, gender)
  loop
    if exists (
      select 1 from public.players p
      where p.team = 'U16'
        and (
          (p.first_name = rec.first_name and p.last_name = rec.last_name)
          or (rec.first_name = 'Yoro' and p.phone = rec.phone)
        )
    ) then
      continue;
    end if;

    v_counter := v_counter + 1;
    v_matricule := 'SFA-2026-' || lpad(v_counter::text, 3, '0');
    while exists (select 1 from public.players where matricule = v_matricule) loop
      v_counter := v_counter + 1;
      v_matricule := 'SFA-2026-' || lpad(v_counter::text, 3, '0');
    end loop;

    insert into public.players (
      matricule, first_name, last_name, birth_date, gender,
      category, team, phone, guardian_name
    ) values (
      v_matricule, rec.first_name, rec.last_name,
      '2010-01-15', rec.gender, 'u16', 'U16', rec.phone,
      rec.last_name || ' ' || rec.first_name
    );
  end loop;
end;
$$;

-- Vérification
select team, category, count(*) as total
from public.players
where not is_archived
group by team, category
order by team;
