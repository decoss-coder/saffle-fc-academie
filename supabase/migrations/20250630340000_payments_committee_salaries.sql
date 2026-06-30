-- Paiements joueurs : payeur réel, annulation
alter table public.payments
  add column if not exists payer_name text;

create or replace function public.cancel_payment(
  p_payment_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_due public.player_dues%rowtype;
  v_new_paid numeric;
  v_new_status public.due_status;
begin
  if public.get_my_role() not in ('admin', 'treasurer', 'president') then
    raise exception 'not_authorized';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception 'reason_required';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status not in ('completed', 'pending') then
    raise exception 'invalid_status';
  end if;

  update public.payments
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_payment_id;

  select * into v_due from public.player_dues where id = v_payment.player_due_id for update;
  if found and v_payment.status = 'completed' then
    v_new_paid := greatest(v_due.amount_paid - v_payment.amount, 0);
    if v_new_paid >= v_due.amount_due then
      v_new_status := 'paid';
    elsif v_new_paid > 0 then
      v_new_status := 'partial';
    else
      v_new_status := 'pending';
    end if;

    if v_due.due_date is not null and v_due.due_date < current_date and v_new_status <> 'paid' then
      v_new_status := 'overdue';
    end if;

    update public.player_dues
    set amount_paid = v_new_paid, status = v_new_status, updated_at = now()
    where id = v_due.id;
  end if;

  insert into public.payment_audit_logs (payment_id, user_id, action, new_values, reason)
  values (
    p_payment_id,
    auth.uid(),
    'cancelled',
    jsonb_build_object('amount', v_payment.amount, 'previous_status', v_payment.status),
    p_reason
  );
end;
$$;

revoke all on function public.cancel_payment(uuid, text) from public;
grant execute on function public.cancel_payment(uuid, text) to authenticated;

create or replace function public.record_manual_payment(
  p_due_id uuid,
  p_amount numeric,
  p_method public.payment_method default 'cash',
  p_notes text default null,
  p_payer_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_due public.player_dues%rowtype;
  v_payment_id uuid;
  v_new_paid numeric;
  v_new_status public.due_status;
begin
  if public.get_my_role() not in ('admin', 'treasurer', 'president') then
    raise exception 'not_authorized';
  end if;

  if p_amount < 100 then
    raise exception 'minimum_amount';
  end if;

  select * into v_due from public.player_dues where id = p_due_id for update;
  if not found then
    raise exception 'due_not_found';
  end if;

  if p_amount > v_due.remaining_amount then
    raise exception 'amount_too_high';
  end if;

  insert into public.payments (
    player_due_id,
    player_id,
    payer_user_id,
    payer_type,
    payer_name,
    amount,
    payment_method,
    status,
    paid_at,
    validated_at,
    validated_by,
    receipt_number
  ) values (
    p_due_id,
    v_due.player_id,
    auth.uid(),
    case public.get_my_role()
      when 'treasurer' then 'treasurer'::public.payer_type
      else 'admin'::public.payer_type
    end,
    nullif(trim(p_payer_name), ''),
    p_amount,
    p_method,
    'completed',
    now(),
    now(),
    auth.uid(),
    'REC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6))
  )
  returning id into v_payment_id;

  v_new_paid := v_due.amount_paid + p_amount;
  if v_new_paid >= v_due.amount_due then
    v_new_status := 'paid';
  else
    v_new_status := 'partial';
  end if;

  update public.player_dues
  set amount_paid = v_new_paid, status = v_new_status, updated_at = now()
  where id = v_due.id;

  insert into public.payment_audit_logs (payment_id, user_id, action, new_values, reason)
  values (
    v_payment_id,
    auth.uid(),
    'manual_record',
    jsonb_build_object('amount', p_amount, 'payer_name', p_payer_name),
    p_notes
  );

  return v_payment_id;
end;
$$;

revoke all on function public.record_manual_payment(uuid, numeric, public.payment_method, text, text) from public;
grant execute on function public.record_manual_payment(uuid, numeric, public.payment_method, text, text) to authenticated;

drop function if exists public.record_manual_payment(uuid, numeric, public.payment_method, text);

-- Comité : retrait coach + colonnes Wave
create or replace function public.is_committee_registry_role(r public.user_role)
returns boolean
language sql
immutable
as $$
  select r in (
    'president', 'board', 'treasurer',
    'communication', 'logistics', 'admin'
  );
$$;

update public.committee_dues cd
set status = 'cancelled', updated_at = now()
from public.phone_registry pr
where pr.phone_normalized = cd.member_phone
  and pr.role = 'coach'
  and cd.status in ('pending', 'partial');

alter table public.committee_due_payments
  add column if not exists status text not null default 'completed'
    check (status in ('pending', 'completed', 'cancelled')),
  add column if not exists wave_session_id text,
  add column if not exists wave_checkout_url text,
  add column if not exists receipt_number text,
  add column if not exists payer_user_id uuid references auth.users (id) on delete set null;

update public.committee_due_payments set status = 'completed' where status is null;

create or replace function public.initiate_committee_wave_payment(
  p_due_id uuid,
  p_amount numeric,
  p_wave_session_id text,
  p_wave_checkout_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_due public.committee_dues%rowtype;
  v_payment_id uuid;
  v_is_treasurer boolean;
  v_is_member boolean;
begin
  select * into v_due from public.committee_dues where id = p_due_id for update;
  if not found then
    raise exception 'due_not_found';
  end if;

  v_is_treasurer := public.get_my_role() in ('admin', 'treasurer', 'president');
  v_is_member := exists (
    select 1 from public.phone_registry pr
    where pr.phone_normalized = v_due.member_phone
      and pr.linked_user_id = auth.uid()
  );

  if not v_is_treasurer and not v_is_member then
    raise exception 'not_authorized';
  end if;

  if p_amount < 100 then
    raise exception 'minimum_amount';
  end if;

  if p_amount > (v_due.amount_due - v_due.amount_paid) then
    raise exception 'amount_too_high';
  end if;

  insert into public.committee_due_payments (
    committee_due_id,
    amount,
    payment_method,
    status,
    wave_session_id,
    wave_checkout_url,
    payer_user_id,
    recorded_by
  ) values (
    p_due_id,
    p_amount,
    'wave',
    'pending',
    p_wave_session_id,
    p_wave_checkout_url,
    auth.uid(),
    auth.uid()
  )
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

revoke all on function public.initiate_committee_wave_payment(uuid, numeric, text, text) from public;
grant execute on function public.initiate_committee_wave_payment(uuid, numeric, text, text) to authenticated;

create or replace function public.confirm_committee_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.committee_due_payments%rowtype;
  v_due public.committee_dues%rowtype;
  v_new_paid numeric;
  v_new_status text;
begin
  if public.get_my_role() not in ('admin', 'treasurer', 'president') then
    raise exception 'not_authorized';
  end if;

  select * into v_payment from public.committee_due_payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'invalid_status';
  end if;

  update public.committee_due_payments
  set
    status = 'completed',
    paid_at = now(),
    receipt_number = coalesce(
      receipt_number,
      'REC-C-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(p_payment_id::text, '-', ''), 1, 6))
    )
  where id = p_payment_id;

  select * into v_due from public.committee_dues where id = v_payment.committee_due_id for update;
  v_new_paid := v_due.amount_paid + v_payment.amount;

  if v_new_paid >= v_due.amount_due then
    v_new_status := 'paid';
  elsif v_new_paid > 0 then
    v_new_status := 'partial';
  else
    v_new_status := 'pending';
  end if;

  update public.committee_dues
  set amount_paid = v_new_paid, status = v_new_status, updated_at = now()
  where id = v_due.id;
end;
$$;

revoke all on function public.confirm_committee_payment(uuid) from public;
grant execute on function public.confirm_committee_payment(uuid) to authenticated;

create or replace function public.cancel_committee_payment(
  p_payment_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.committee_due_payments%rowtype;
  v_due public.committee_dues%rowtype;
  v_new_paid numeric;
  v_new_status text;
begin
  if public.get_my_role() not in ('admin', 'treasurer', 'president') then
    raise exception 'not_authorized';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception 'reason_required';
  end if;

  select * into v_payment from public.committee_due_payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status not in ('completed', 'pending') then
    raise exception 'invalid_status';
  end if;

  update public.committee_due_payments
  set status = 'cancelled', notes = coalesce(notes || ' — ', '') || p_reason
  where id = p_payment_id;

  if v_payment.status = 'completed' then
    select * into v_due from public.committee_dues where id = v_payment.committee_due_id for update;
    v_new_paid := greatest(v_due.amount_paid - v_payment.amount, 0);
    if v_new_paid >= v_due.amount_due then
      v_new_status := 'paid';
    elsif v_new_paid > 0 then
      v_new_status := 'partial';
    else
      v_new_status := 'pending';
    end if;

    update public.committee_dues
    set amount_paid = v_new_paid, status = v_new_status, updated_at = now()
    where id = v_due.id;
  end if;
end;
$$;

revoke all on function public.cancel_committee_payment(uuid, text) from public;
grant execute on function public.cancel_committee_payment(uuid, text) to authenticated;

-- Salaires coachs
create table public.staff_salary_lines (
  id uuid primary key default gen_random_uuid(),
  beneficiary_phone text not null references public.phone_registry (phone_normalized) on delete cascade,
  label text not null,
  period_month date not null,
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  payment_method text check (
    payment_method is null or payment_method in ('wave', 'cash', 'bank_transfer', 'other')
  ),
  notes text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index staff_salary_lines_beneficiary_idx on public.staff_salary_lines (beneficiary_phone);
create index staff_salary_lines_period_idx on public.staff_salary_lines (period_month desc);

alter table public.staff_salary_lines enable row level security;

create policy "Finance executives view salary lines"
  on public.staff_salary_lines for select
  using (public.get_my_role() in ('admin', 'president', 'treasurer'));

create policy "Treasurer manage salary lines"
  on public.staff_salary_lines for all
  using (public.get_my_role() in ('admin', 'president', 'treasurer'))
  with check (public.get_my_role() in ('admin', 'president', 'treasurer'));
