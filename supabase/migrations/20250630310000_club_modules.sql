-- Modules club : planning, équipement, discipline, matchs, logistique, aides, transport, intéressement

-- ─── Planning entraînements ───
create table public.team_training_targets (
  team text primary key,
  min_hours_per_week numeric(4,1) not null default 4,
  championship_date date,
  updated_at timestamptz not null default now()
);

insert into public.team_training_targets (team, min_hours_per_week)
values ('U12', 4), ('U16', 5), ('Équipe A', 6), ('Équipe B', 6)
on conflict (team) do nothing;

create table public.training_schedules (
  id uuid primary key default gen_random_uuid(),
  team text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index training_schedules_team_idx on public.training_schedules (team);

-- ─── Équipement joueur ───
create type public.equipment_item_status as enum ('ok', 'need_renewal', 'missing', 'loaned');

create table public.player_equipment (
  player_id uuid primary key references public.players (id) on delete cascade,
  jersey_status public.equipment_item_status not null default 'ok',
  shorts_status public.equipment_item_status not null default 'ok',
  socks_status public.equipment_item_status not null default 'ok',
  shin_guards_status public.equipment_item_status not null default 'ok',
  shoe_size text,
  shoe_loaned boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

-- ─── Inventaire & prêts ───
create table public.equipment_inventory (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  label text not null,
  size text,
  team text,
  status text not null default 'available' check (status in ('available', 'loaned', 'damaged')),
  created_at timestamptz not null default now()
);

create table public.equipment_loans (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.equipment_inventory (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  loaned_at timestamptz not null default now(),
  due_at date,
  returned_at timestamptz,
  notes text
);

-- ─── Discipline ───
create type public.discipline_status as enum ('active', 'warning', 'suspended');

alter table public.players
  add column if not exists discipline_status public.discipline_status not null default 'active';

create table public.player_discipline_records (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  incident_type text not null check (incident_type in ('absence', 'late', 'warning', 'suspension', 'encouragement')),
  description text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index player_discipline_player_idx on public.player_discipline_records (player_id);

-- ─── Médical / assurance ───
alter table public.players
  add column if not exists insurance_provider text,
  add column if not exists insurance_number text,
  add column if not exists medical_cert_expires_at date,
  add column if not exists team_doctor_contact text;

-- ─── Matchs & primes ───
create table public.club_matches (
  id uuid primary key default gen_random_uuid(),
  team text not null,
  title text not null,
  opponent text,
  match_date timestamptz not null,
  score_home integer,
  score_away integer,
  is_victory boolean not null default false,
  bonus_amount numeric(12,2) not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.match_player_bonuses (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.club_matches (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  unique (match_id, player_id)
);

-- ─── Intéressement ───
create table public.profit_sharing_pools (
  id uuid primary key default gen_random_uuid(),
  team text not null,
  label text not null,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  per_player_amount numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'distributed', 'closed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Aides sociales (confidentiel) ───
create table public.welfare_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  request_type text not null check (request_type in ('housing', 'food', 'other')),
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected')),
  submitted_by uuid not null references auth.users (id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Logistique ───
create table public.logistics_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('mower', 'gym', 'field', 'locker_room', 'other')),
  scheduled_for date,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Transport ───
create table public.transport_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  convocation_id uuid references public.convocations (id) on delete set null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  submitted_by uuid not null references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── RLS helper ───
create or replace function public.is_club_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.get_my_role() in ('admin', 'president', 'coach', 'treasurer');
$$;

revoke all on function public.is_club_staff() from public;
grant execute on function public.is_club_staff() to authenticated;

-- ─── Enable RLS ───
alter table public.team_training_targets enable row level security;
alter table public.training_schedules enable row level security;
alter table public.player_equipment enable row level security;
alter table public.equipment_inventory enable row level security;
alter table public.equipment_loans enable row level security;
alter table public.player_discipline_records enable row level security;
alter table public.club_matches enable row level security;
alter table public.match_player_bonuses enable row level security;
alter table public.profit_sharing_pools enable row level security;
alter table public.welfare_requests enable row level security;
alter table public.logistics_tasks enable row level security;
alter table public.transport_requests enable row level security;

-- Staff read/write club ops
create policy "Staff manage training targets"
  on public.team_training_targets for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Staff manage training schedules"
  on public.training_schedules for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Anyone view training targets"
  on public.team_training_targets for select using (true);

create policy "Anyone view training schedules"
  on public.training_schedules for select using (true);

create policy "Staff manage player equipment"
  on public.player_equipment for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Guardians view player equipment"
  on public.player_equipment for select
  using (public.can_access_player(player_id));

create policy "Staff manage inventory"
  on public.equipment_inventory for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Staff manage loans"
  on public.equipment_loans for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Staff manage discipline records"
  on public.player_discipline_records for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Guardians view discipline records"
  on public.player_discipline_records for select
  using (public.can_access_player(player_id));

create policy "Staff manage matches"
  on public.club_matches for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Staff manage match bonuses"
  on public.match_player_bonuses for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Treasurer manage profit sharing"
  on public.profit_sharing_pools for all
  using (public.get_my_role() in ('admin', 'president', 'treasurer'))
  with check (public.get_my_role() in ('admin', 'president', 'treasurer'));

create policy "Admin manage welfare"
  on public.welfare_requests for all
  using (public.get_my_role() in ('admin', 'president'))
  with check (public.get_my_role() in ('admin', 'president'));

create policy "Submit welfare for linked player"
  on public.welfare_requests for insert
  with check (
    public.can_access_player(player_id)
    and submitted_by = auth.uid()
  );

create policy "View own welfare requests"
  on public.welfare_requests for select
  using (
    submitted_by = auth.uid()
    or public.get_my_role() in ('admin', 'president')
  );

create policy "Staff manage logistics"
  on public.logistics_tasks for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Staff manage transport"
  on public.transport_requests for all
  using (public.is_club_staff()) with check (public.is_club_staff());

create policy "Submit transport for linked player"
  on public.transport_requests for insert
  with check (
    public.can_access_player(player_id)
    and submitted_by = auth.uid()
  );

create policy "View transport requests"
  on public.transport_requests for select
  using (
    submitted_by = auth.uid()
    or public.is_club_staff()
  );
