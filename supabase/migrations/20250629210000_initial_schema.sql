-- SAFFLE FC Académie — schéma complet v1

-- Enums
create type public.user_role as enum (
  'admin',
  'president',
  'board',
  'treasurer',
  'coach',
  'parent',
  'player_formation',
  'player_team_a',
  'communication',
  'logistics'
);

create type public.player_category as enum (
  'u10', 'u11', 'u12', 'u13', 'u14', 'u15', 'u16', 'u17', 'u18', 'team_a', 'team_b'
);

create type public.due_status as enum (
  'pending', 'partial', 'paid', 'overdue', 'cancelled'
);

create type public.payment_status as enum (
  'pending', 'completed', 'failed', 'cancelled', 'refunded'
);

create type public.payer_type as enum (
  'player', 'parent', 'treasurer', 'admin'
);

create type public.payment_method as enum (
  'wave', 'cash', 'bank_transfer', 'other'
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'parent',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seasons
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Players
create table public.players (
  id uuid primary key default gen_random_uuid(),
  matricule text unique not null,
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  gender text not null check (gender in ('M', 'F')),
  category public.player_category not null,
  team text,
  photo_url text,
  father_name text,
  mother_name text,
  guardian_name text,
  address text,
  phone text,
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  strong_foot text,
  primary_position text,
  secondary_position text,
  user_id uuid references auth.users (id) on delete set null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Player guardians (parent ↔ player links)
create table public.player_guardians (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  relationship text not null default 'parent',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (player_id, guardian_id)
);

-- Player dues (cotisations)
create table public.player_dues (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  season_id uuid references public.seasons (id) on delete set null,
  due_type text not null,
  label text not null,
  amount_due numeric(12,2) not null check (amount_due >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  remaining_amount numeric(12,2) generated always as (amount_due - amount_paid) stored,
  status public.due_status not null default 'pending',
  due_date date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  player_due_id uuid not null references public.player_dues (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  payer_user_id uuid references public.profiles (id),
  payer_type public.payer_type not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method public.payment_method not null default 'cash',
  status public.payment_status not null default 'pending',
  reference text,
  external_reference text,
  wave_checkout_url text,
  paid_at timestamptz,
  validated_at timestamptz,
  validated_by uuid references public.profiles (id),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  cancellation_reason text,
  receipt_number text,
  receipt_pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payment audit logs
create table public.payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  user_id uuid references public.profiles (id),
  action text not null,
  old_values jsonb,
  new_values jsonb,
  reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Indexes
create index players_category_idx on public.players (category);
create index players_matricule_idx on public.players (matricule);
create index player_dues_player_id_idx on public.player_dues (player_id);
create index player_dues_status_idx on public.player_dues (status);
create index payments_player_id_idx on public.payments (player_id);
create index payments_status_idx on public.payments (status);

-- RLS
alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.players enable row level security;
alter table public.player_guardians enable row level security;
alter table public.player_dues enable row level security;
alter table public.payments enable row level security;
alter table public.payment_audit_logs enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'president', 'treasurer')
    )
  );

-- Players: guardians see linked players
create policy "Guardians can view linked players"
  on public.players for select
  using (
    exists (
      select 1 from public.player_guardians pg
      where pg.player_id = players.id and pg.guardian_id = auth.uid()
    )
    or user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'coach', 'treasurer', 'president')
    )
  );

-- Player dues: visible to player, guardians, staff
create policy "View player dues"
  on public.player_dues for select
  using (
    exists (select 1 from public.players pl where pl.id = player_dues.player_id and pl.user_id = auth.uid())
    or exists (select 1 from public.player_guardians pg where pg.player_id = player_dues.player_id and pg.guardian_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'treasurer', 'president'))
  );

-- Payments: same visibility as dues
create policy "View payments"
  on public.payments for select
  using (
    exists (select 1 from public.players pl where pl.id = payments.player_id and pl.user_id = auth.uid())
    or exists (select 1 from public.player_guardians pg where pg.player_id = payments.player_id and pg.guardian_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'treasurer', 'president'))
  );

-- Staff read seasons
create policy "Authenticated users can view seasons"
  on public.seasons for select to authenticated using (true);

-- Auth trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger players_updated_at before update on public.players
  for each row execute function public.set_updated_at();
create trigger player_dues_updated_at before update on public.player_dues
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
