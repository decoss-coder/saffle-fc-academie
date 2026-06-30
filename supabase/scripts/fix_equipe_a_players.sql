-- Correction : joueurs Équipe A (U14-U15 + 4 noms retirés des petits U9-U10)
-- Exécuter dans Supabase SQL Editor.

-- 1. Retirer des petits et passer en Équipe A (2e capture + Tia déjà listé chez les grands)
update public.players
set
  team = 'Équipe A',
  category = 'team_a',
  birth_date = '2010-06-15'
where team = 'U9-U10'
  and (
    (first_name = 'Japhet David' and last_name = 'Kouassi')
    or (first_name = 'Kouassi Emmanuel' and last_name = 'Kouassi')
    or (first_name = 'Andre Samuel' and last_name = 'Gbagbo')
    or (first_name = 'Gedeon' and last_name = 'Gnandé Têhi')
    or (first_name = 'Yoro Alaman' and last_name = 'Tia')
  );

-- Corriger le prénom Emmanuel → Kouabi Emmanuel
update public.players
set first_name = 'Kouabi Emmanuel'
where first_name = 'Kouassi Emmanuel'
  and last_name = 'Kouassi'
  and team = 'Équipe A';

-- Téléphone Gbagbo (si besoin)
update public.players
set phone = '+2250707798224'
where first_name = 'Andre Samuel'
  and last_name = 'Gbagbo'
  and team = 'Équipe A';

-- 2. Ajouter les grands U14-U15 (Équipe A)
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
      where p.first_name = rec.first_name
        and p.last_name = rec.last_name
        and p.team = 'Équipe A'
    ) then
      continue;
    end if;

    -- Tia Yoro : déjà déplacé depuis U9-U10 sous Yoro Alaman / Tia
    if rec.first_name = 'Yoro' and rec.last_name = 'Tia' then
      if exists (
        select 1 from public.players
        where phone = rec.phone and team = 'Équipe A'
      ) then
        update public.players
        set first_name = 'Yoro', last_name = 'Tia'
        where phone = rec.phone and team = 'Équipe A';
        continue;
      end if;
    end if;

    v_counter := v_counter + 1;
    v_matricule := 'SFA-2026-' || lpad(v_counter::text, 3, '0');

    while exists (select 1 from public.players where matricule = v_matricule) loop
      v_counter := v_counter + 1;
      v_matricule := 'SFA-2026-' || lpad(v_counter::text, 3, '0');
    end loop;

    insert into public.players (
      matricule,
      first_name,
      last_name,
      birth_date,
      gender,
      category,
      team,
      phone,
      guardian_name
    ) values (
      v_matricule,
      rec.first_name,
      rec.last_name,
      '2010-06-15',
      rec.gender,
      'team_a',
      'Équipe A',
      rec.phone,
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
