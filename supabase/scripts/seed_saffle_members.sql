-- Import des membres SAFFLE FF Académie CI (staff + joueurs U9-U10)
-- Exécuter dans Supabase SQL Editor après les migrations.
-- Idempotent : peut être relancé sans doublons.

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

-- ─── JOUEURS GROUPE U9-U10 ────────────────────────────────────────
-- Téléphone = contact parent/tuteur (connexion parent sur la plateforme)

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
        ('Yoro Alaman', 'Tia', '+2250546239699'),
        ('Serge', 'Olou', '+2250748871139'),
        ('Assafe', 'Attahi', '+2250709365594'),
        ('Moye', 'Koffi', '+2250787757075'),
        ('Samuel', 'Botteli', '+2250779186222'),
        ('Japhet David', 'Kouassi', '+2250747610599'),
        ('Kouassi Emmanuel', 'Kouassi', '+2250747610599'),
        ('Andre Samuel', 'Gbagbo', '+2250707798224'),
        ('Gedeon', 'Gnandé Têhi', '+2250564001094')
    ) as t(first_name, last_name, phone)
  loop
    if exists (
      select 1 from public.players p
      where p.first_name = rec.first_name
        and p.last_name = rec.last_name
        and p.team = 'U9-U10'
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
      '2016-01-15',
      'M',
      'u10',
      'U9-U10',
      rec.phone,
      rec.last_name || ' ' || rec.first_name
    );
  end loop;
end;
$$;

-- Vérification rapide
select 'phone_registry' as table_name, count(*) as total from public.phone_registry
union all
select 'players U9-U10', count(*) from public.players where team = 'U9-U10';
