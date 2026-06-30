-- Champs complémentaires pour fiche joueur (alignés fédération / FIFA Connect)
alter table public.players
  add column if not exists birth_name text,
  add column if not exists nationality text default 'Côte d''Ivoire',
  add column if not exists secondary_nationality text,
  add column if not exists birth_country text default 'Côte d''Ivoire',
  add column if not exists birth_region text,
  add column if not exists birth_city text,
  add column if not exists birth_certificate_ref text,
  add column if not exists former_license_number text;
