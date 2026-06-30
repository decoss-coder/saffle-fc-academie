-- Budget prévisionnel saison + recettes/dépenses manuelles + comité directeur

-- ─── Budget ───
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete restrict,
  title text not null,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'active', 'closed')
  ),
  total_recettes_planned numeric(14,2) not null default 0,
  total_depenses_planned numeric(14,2) not null default 0,
  notes text,
  submitted_at timestamptz,
  submitted_by uuid references auth.users (id) on delete set null,
  activated_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index budgets_season_idx on public.budgets (season_id);
create index budgets_status_idx on public.budgets (status);

create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  line_type text not null check (line_type in ('recette', 'depense')),
  category text not null,
  label text not null,
  amount_planned numeric(14,2) not null check (amount_planned >= 0),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index budget_lines_budget_idx on public.budget_lines (budget_id);

-- Validation budget : SG + Président + TG (trésorier)
create table public.budget_signoffs (
  budget_id uuid not null references public.budgets (id) on delete cascade,
  signoff_role text not null check (
    signoff_role in ('secretary_general', 'president', 'treasurer')
  ),
  user_id uuid not null references auth.users (id) on delete set null,
  signed_at timestamptz not null default now(),
  comment text,
  primary key (budget_id, signoff_role)
);

-- Recettes réelles (saisie manuelle, pas d'alimentation auto depuis payments)
create table public.budget_receipts (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  budget_line_id uuid references public.budget_lines (id) on delete set null,
  receipt_type text not null check (
    receipt_type in (
      'cotisation_eleves',
      'cotisation_comite',
      'subvention',
      'don',
      'autre'
    )
  ),
  label text not null,
  amount numeric(14,2) not null check (amount > 0),
  received_at date not null default current_date,
  payment_method text not null default 'cash' check (
    payment_method in ('wave', 'cash', 'bank_transfer', 'other')
  ),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index budget_receipts_budget_idx on public.budget_receipts (budget_id);

-- Dépenses réelles
create table public.budget_expenses (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  budget_line_id uuid references public.budget_lines (id) on delete set null,
  label text not null,
  amount numeric(14,2) not null check (amount > 0),
  expense_date date not null default current_date,
  payment_method text not null default 'cash' check (
    payment_method in ('wave', 'cash', 'bank_transfer', 'other')
  ),
  status text not null default 'recorded' check (
    status in ('recorded', 'pending_approval', 'approved', 'rejected')
  ),
  is_over_budget boolean not null default false,
  over_budget_amount numeric(14,2) not null default 0,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index budget_expenses_budget_idx on public.budget_expenses (budget_id);

-- Hors budget : validation SG + Président
create table public.budget_expense_signoffs (
  expense_id uuid not null references public.budget_expenses (id) on delete cascade,
  signoff_role text not null check (
    signoff_role in ('secretary_general', 'president')
  ),
  user_id uuid not null references auth.users (id) on delete set null,
  decision text not null check (decision in ('approved', 'rejected')),
  signed_at timestamptz not null default now(),
  comment text,
  primary key (expense_id, signoff_role)
);

-- ─── Comité directeur : cotisations membres ───
create table public.committee_dues (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  member_phone text not null references public.phone_registry (phone_normalized) on delete cascade,
  label text not null,
  amount_due numeric(14,2) not null check (amount_due > 0),
  amount_paid numeric(14,2) not null default 0,
  status text not null default 'pending' check (
    status in ('pending', 'partial', 'paid', 'cancelled')
  ),
  due_date date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index committee_dues_member_idx on public.committee_dues (member_phone);
create index committee_dues_season_idx on public.committee_dues (season_id);

create table public.committee_due_payments (
  id uuid primary key default gen_random_uuid(),
  committee_due_id uuid not null references public.committee_dues (id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text not null default 'cash' check (
    payment_method in ('wave', 'cash', 'bank_transfer', 'other')
  ),
  paid_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id) on delete set null,
  notes text,
  budget_receipt_id uuid references public.budget_receipts (id) on delete set null
);

-- ─── Helpers rôle métier ───
create or replace function public.get_my_position_title()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select position_title
  from public.phone_registry
  where linked_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_position_title() from public;
grant execute on function public.get_my_position_title() to authenticated;

create or replace function public.is_secretary_general()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.get_my_role() = 'admin'::public.user_role
    or (
      public.get_my_role() = 'board'::public.user_role
      and coalesce(public.get_my_position_title(), '') ilike '%secr%'
    );
$$;

revoke all on function public.is_secretary_general() from public;
grant execute on function public.is_secretary_general() to authenticated;

create or replace function public.is_budget_executive()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.get_my_role() in (
    'admin', 'president', 'treasurer', 'board'
  );
$$;

revoke all on function public.is_budget_executive() from public;
grant execute on function public.is_budget_executive() to authenticated;

create or replace function public.is_committee_registry_role(r public.user_role)
returns boolean
language sql
immutable
as $$
  select r in (
    'president', 'board', 'treasurer', 'coach',
    'communication', 'logistics', 'admin'
  );
$$;

-- ─── RLS ───
alter table public.budgets enable row level security;
alter table public.budget_lines enable row level security;
alter table public.budget_signoffs enable row level security;
alter table public.budget_receipts enable row level security;
alter table public.budget_expenses enable row level security;
alter table public.budget_expense_signoffs enable row level security;
alter table public.committee_dues enable row level security;
alter table public.committee_due_payments enable row level security;

create policy "Executives view budgets"
  on public.budgets for select
  using (public.is_budget_executive());

create policy "Treasurer manage budgets"
  on public.budgets for all
  using (public.get_my_role() in ('admin', 'president', 'treasurer'))
  with check (public.get_my_role() in ('admin', 'president', 'treasurer'));

create policy "Executives view budget lines"
  on public.budget_lines for select
  using (public.is_budget_executive());

create policy "Treasurer manage budget lines"
  on public.budget_lines for all
  using (public.get_my_role() in ('admin', 'president', 'treasurer'))
  with check (public.get_my_role() in ('admin', 'president', 'treasurer'));

create policy "Executives view budget signoffs"
  on public.budget_signoffs for select
  using (public.is_budget_executive());

create policy "Signatories insert budget signoffs"
  on public.budget_signoffs for insert
  with check (
    (signoff_role = 'secretary_general' and public.is_secretary_general())
    or (signoff_role = 'president' and public.get_my_role() in ('admin', 'president'))
    or (signoff_role = 'treasurer' and public.get_my_role() in ('admin', 'president', 'treasurer'))
  );

create policy "Executives view receipts"
  on public.budget_receipts for select
  using (public.is_budget_executive());

create policy "Treasurer manage receipts"
  on public.budget_receipts for all
  using (public.get_my_role() in ('admin', 'president', 'treasurer'))
  with check (public.get_my_role() in ('admin', 'president', 'treasurer'));

create policy "Executives view expenses"
  on public.budget_expenses for select
  using (public.is_budget_executive());

create policy "Treasurer manage expenses"
  on public.budget_expenses for all
  using (public.get_my_role() in ('admin', 'president', 'treasurer'))
  with check (public.get_my_role() in ('admin', 'president', 'treasurer'));

create policy "Executives view expense signoffs"
  on public.budget_expense_signoffs for select
  using (public.is_budget_executive());

create policy "SG or president sign off expenses"
  on public.budget_expense_signoffs for insert
  with check (
    (signoff_role = 'secretary_general' and public.is_secretary_general())
    or (signoff_role = 'president' and public.get_my_role() in ('admin', 'president'))
  );

create policy "Treasurer manage committee dues"
  on public.committee_dues for all
  using (public.get_my_role() in ('admin', 'president', 'treasurer'))
  with check (public.get_my_role() in ('admin', 'president', 'treasurer'));

create policy "Committee members view own dues"
  on public.committee_dues for select
  using (
    exists (
      select 1 from public.phone_registry pr
      where pr.phone_normalized = committee_dues.member_phone
        and pr.linked_user_id = auth.uid()
    )
    or public.get_my_role() in ('admin', 'president', 'treasurer')
  );

create policy "Treasurer manage committee payments"
  on public.committee_due_payments for all
  using (public.get_my_role() in ('admin', 'president', 'treasurer'))
  with check (public.get_my_role() in ('admin', 'president', 'treasurer'));

create policy "Committee members view own payments"
  on public.committee_due_payments for select
  using (
    exists (
      select 1
      from public.committee_dues cd
      join public.phone_registry pr on pr.phone_normalized = cd.member_phone
      where cd.id = committee_due_payments.committee_due_id
        and pr.linked_user_id = auth.uid()
    )
    or public.get_my_role() in ('admin', 'president', 'treasurer')
  );
