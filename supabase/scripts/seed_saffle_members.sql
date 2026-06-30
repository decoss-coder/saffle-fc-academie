-- Import des membres SAFFLE FF Académie CI
-- Groupes : U12 (petits), U16 (grands), Équipe A (liste à venir — vide pour l'instant)

-- ─── BUREAU & STAFF ───────────────────────────────────────────────
insert into public.phone_registry (phone_normalized, role, full_name, position_title)
values
  ('+2250505505102', 'president', 'Frey', 'Président'),
  ('+33605940045', 'board', 'Mahan Simplice', 'Vice-président'),
  ('+2250707732032', 'treasurer', 'Coulibaly Adama', 'Trésorier'),
  ('+46729616300', 'board', 'Coulibaly Ysmael', 'Manager'),
  ('+2250749997778', 'coach', 'DOGBO Sylvain', 'Directeur sportif'),
  ('+2250103464764', 'board', 'Loboué Brice', 'Secrétaire'),
  ('+2250585040680', 'communication', 'Marie France Coulibaly', 'Chargé de communication'),
  ('+2250102423288', 'board', 'Adingra', 'Docteur du club'),
  ('+2250708012818', 'board', 'Niankalé', 'Docteur adjoint'),
  ('+14389280621', 'board', 'Mahan Bi', 'Membre bureau'),
  ('+2250555870088', 'coach', 'Dosso Abdoulaye', 'Entraîneur équipe A'),
  ('+2250576105837', 'coach', 'Tchêssê Zimako', 'Entraîneur adjoint'),
  ('+2250747173589', 'coach', 'Bakayoko Souleymane', 'Entraîneur académie'),
  ('+2250585070739', 'coach', 'Oumar Ouedraogo', 'Entraîneur adjoint'),
  ('+2250545356174', 'logistics', 'Dougouné Bi Kouassi Hypolite', 'Chef matériel'),
  ('+2250707189702', 'admin', 'Boty Dia Armel', 'Administrateur plateforme')
on conflict (phone_normalized) do update
set
  role = excluded.role,
  full_name = excluded.full_name,
  position_title = excluded.position_title,
  updated_at = now();

-- ─── JOUEURS U12 (petits) ─────────────────────────────────────────
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
        ('Kene', 'Moussa', '+2250707221205'),
        ('Gouzile', 'Bedy', '+2250700568060'),
        ('Anzoumana', 'Sylla', '+2250707471490'),
        ('Kertus', 'Brey', '+2250564637064'),
        ('Jean Enock', 'Wapo', '+2250757953827'),
        ('Abdoul Aziz', 'Coulibaly', '+2250707264561'),
        ('Kouadio Serge', 'Kouassi', '+2250707762456'),
        ('Ahmed', 'Cherif', '+2250545385597'),
        ('Aboubacar', 'Ballo Kaffo', '+2250707137880'),
        ('Fonan', 'Coulibaly', '+2250102709087'),
        ('Uriel Nathan', 'Bakouri', '+2250708602259'),
        ('Mohamed', 'Dagnogo', '+2250768220120'),
        ('Serge', 'Olou', '+2250748871139'),
        ('Assafe', 'Attahi', '+2250709365594'),
        ('Moye', 'Koffi', '+2250787757075'),
        ('Samuel', 'Botteli', '+2250779186222')
    ) as t(first_name, last_name, phone)
  loop
    if exists (
      select 1 from public.players p
      where p.first_name = rec.first_name
        and p.last_name = rec.last_name
        and p.team = 'U12'
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
      '2014-01-15', 'M', 'u12', 'U12', rec.phone,
      rec.last_name || ' ' || rec.first_name
    );
  end loop;
end;
$$;

-- ─── JOUEURS U16 (grands) ─────────────────────────────────────────
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
      where p.first_name = rec.first_name
        and p.last_name = rec.last_name
        and p.team = 'U16'
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

-- Équipe A : réservée — ajouter via seed_equipe_a.sql quand la liste sera disponible

-- Vérification
select team, count(*) as total
from public.players
where not is_archived
group by team
order by team;
