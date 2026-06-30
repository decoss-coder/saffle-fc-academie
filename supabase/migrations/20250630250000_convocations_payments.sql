-- Convocations + fonctions paiements

create type public.convocation_event_type as enum ('training', 'match', 'other');
create type public.convocation_response as enum (
  'pending', 'confirmed', 'declined', 'late', 'absent'
);

create table public.convocations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type public.convocation_event_type not null default 'training',
  event_date timestamptz not null,
  location text,
  meeting_time timestamptz,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.convocation_entries (
  id uuid primary key default gen_random_uuid(),
  convocation_id uuid not null references public.convocations (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  response public.convocation_response not null default 'pending',
  response_comment text,
  responded_at timestamptz,
  responded_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (convocation_id, player_id)
);

create index convocations_event_date_idx on public.convocations (event_date);
create index convocation_entries_player_idx on public.convocation_entries (player_id);
create index convocation_entries_convocation_idx on public.convocation_entries (convocation_id);

alter table public.convocations enable row level security;
alter table public.convocation_entries enable row level security;

-- Convocations: staff
create policy "Staff manage convocations"
  on public.convocations for all
  using (public.get_my_role() in ('admin', 'president', 'coach'))
  with check (public.get_my_role() in ('admin', 'president', 'coach'));

create policy "Staff manage convocation entries"
  on public.convocation_entries for all
  using (public.get_my_role() in ('admin', 'president', 'coach'))
  with check (public.get_my_role() in ('admin', 'president', 'coach'));

-- Convocations: parents / joueurs liés
create policy "Guardians view convocation entries"
  on public.convocation_entries for select
  using (
    exists (
      select 1 from public.player_guardians pg
      where pg.player_id = convocation_entries.player_id
        and pg.guardian_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      where pl.id = convocation_entries.player_id and pl.user_id = auth.uid()
    )
  );

create policy "Guardians view convocations"
  on public.convocations for select
  using (
    exists (
      select 1 from public.convocation_entries ce
      where ce.convocation_id = convocations.id
        and (
          exists (
            select 1 from public.player_guardians pg
            where pg.player_id = ce.player_id and pg.guardian_id = auth.uid()
          )
          or exists (
            select 1 from public.players pl
            where pl.id = ce.player_id and pl.user_id = auth.uid()
          )
        )
    )
  );

create policy "Guardians respond to convocations"
  on public.convocation_entries for update
  using (
    exists (
      select 1 from public.player_guardians pg
      where pg.player_id = convocation_entries.player_id
        and pg.guardian_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      where pl.id = convocation_entries.player_id and pl.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.player_guardians pg
      where pg.player_id = convocation_entries.player_id
        and pg.guardian_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      where pl.id = convocation_entries.player_id and pl.user_id = auth.uid()
    )
  );

-- Cotisations: gestion staff
drop policy if exists "View player dues" on public.player_dues;
create policy "View player dues"
  on public.player_dues for select
  using (
    exists (
      select 1 from public.players pl
      where pl.id = player_dues.player_id and pl.user_id = auth.uid()
    )
    or exists (
      select 1 from public.player_guardians pg
      where pg.player_id = player_dues.player_id and pg.guardian_id = auth.uid()
    )
    or public.get_my_role() in ('admin', 'treasurer', 'president', 'coach')
  );

create policy "Treasurer manage player dues"
  on public.player_dues for insert
  with check (public.get_my_role() in ('admin', 'treasurer', 'president'));

create policy "Treasurer update player dues"
  on public.player_dues for update
  using (public.get_my_role() in ('admin', 'treasurer', 'president'));

-- Paiements: création parent/staff
create policy "Create payments"
  on public.payments for insert
  with check (
    public.get_my_role() in ('admin', 'treasurer', 'president')
    or (
      payer_user_id = auth.uid()
      and status = 'pending'
      and payment_method = 'wave'
      and (
        exists (
          select 1 from public.player_guardians pg
          where pg.player_id = payments.player_id and pg.guardian_id = auth.uid()
        )
        or exists (
          select 1 from public.players pl
          where pl.id = payments.player_id and pl.user_id = auth.uid()
        )
      )
    )
  );

create policy "Treasurer update payments"
  on public.payments for update
  using (public.get_my_role() in ('admin', 'treasurer', 'president'));

-- Fonction: initier paiement Wave (parent ou staff)
create or replace function public.initiate_wave_payment(
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
  v_due public.player_dues%rowtype;
  v_role public.user_role;
  v_payment_id uuid;
  v_payer_type public.payer_type;
begin
  if p_amount < 100 then
    raise exception 'minimum_amount';
  end if;

  select * into v_due from public.player_dues where id = p_due_id;
  if not found then
    raise exception 'due_not_found';
  end if;

  if v_due.remaining_amount <= 0 then
    raise exception 'already_paid';
  end if;

  if p_amount > v_due.remaining_amount then
    raise exception 'amount_too_high';
  end if;

  v_role := public.get_my_role();

  if v_role in ('admin', 'treasurer', 'president') then
    v_payer_type := case v_role
      when 'treasurer' then 'treasurer'::public.payer_type
      else 'admin'::public.payer_type
    end;
  elsif exists (
    select 1 from public.player_guardians pg
    where pg.player_id = v_due.player_id and pg.guardian_id = auth.uid()
  ) then
    v_payer_type := 'parent';
  elsif exists (
    select 1 from public.players pl
    where pl.id = v_due.player_id and pl.user_id = auth.uid()
  ) then
    v_payer_type := 'player';
  else
    raise exception 'not_authorized';
  end if;

  insert into public.payments (
    player_due_id,
    player_id,
    payer_user_id,
    payer_type,
    amount,
    payment_method,
    status,
    reference,
    external_reference,
    wave_checkout_url
  ) values (
    p_due_id,
    v_due.player_id,
    auth.uid(),
    v_payer_type,
    p_amount,
    'wave',
    'pending',
    p_wave_session_id,
    p_wave_session_id,
    p_wave_checkout_url
  )
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

revoke all on function public.initiate_wave_payment(uuid, numeric, text, text) from public;
grant execute on function public.initiate_wave_payment(uuid, numeric, text, text) to authenticated;

-- Fonction: confirmer paiement (trésorier)
create or replace function public.confirm_payment(p_payment_id uuid)
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

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'invalid_status';
  end if;

  update public.payments
  set
    status = 'completed',
    validated_at = now(),
    validated_by = auth.uid(),
    paid_at = coalesce(paid_at, now()),
    receipt_number = coalesce(
      receipt_number,
      'REC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(p_payment_id::text, '-', ''), 1, 6))
    ),
    updated_at = now()
  where id = p_payment_id;

  select * into v_due from public.player_dues where id = v_payment.player_due_id for update;
  v_new_paid := v_due.amount_paid + v_payment.amount;

  if v_new_paid >= v_due.amount_due then
    v_new_status := 'paid';
  elsif v_new_paid > 0 then
    v_new_status := 'partial';
  else
    v_new_status := v_due.status;
  end if;

  update public.player_dues
  set amount_paid = v_new_paid, status = v_new_status, updated_at = now()
  where id = v_due.id;

  insert into public.payment_audit_logs (payment_id, user_id, action, new_values)
  values (
    p_payment_id,
    auth.uid(),
    'confirmed',
    jsonb_build_object('amount', v_payment.amount, 'due_id', v_payment.player_due_id)
  );
end;
$$;

revoke all on function public.confirm_payment(uuid) from public;
grant execute on function public.confirm_payment(uuid) to authenticated;

-- Fonction: paiement manuel
create or replace function public.record_manual_payment(
  p_due_id uuid,
  p_amount numeric,
  p_method public.payment_method default 'cash',
  p_notes text default null
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
  values (v_payment_id, auth.uid(), 'manual_record', jsonb_build_object('amount', p_amount), p_notes);

  return v_payment_id;
end;
$$;

revoke all on function public.record_manual_payment(uuid, numeric, public.payment_method, text) from public;
grant execute on function public.record_manual_payment(uuid, numeric, public.payment_method, text) to authenticated;

-- Répondre à une convocation (parent)
create or replace function public.respond_convocation(
  p_entry_id uuid,
  p_response public.convocation_response,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.convocation_entries%rowtype;
begin
  select * into v_entry from public.convocation_entries where id = p_entry_id;
  if not found then
    raise exception 'entry_not_found';
  end if;

  if not (
    exists (
      select 1 from public.player_guardians pg
      where pg.player_id = v_entry.player_id and pg.guardian_id = auth.uid()
    )
    or exists (
      select 1 from public.players pl
      where pl.id = v_entry.player_id and pl.user_id = auth.uid()
    )
    or public.get_my_role() in ('admin', 'president', 'coach')
  ) then
    raise exception 'not_authorized';
  end if;

  if p_response = 'pending' then
    raise exception 'invalid_response';
  end if;

  update public.convocation_entries
  set
    response = p_response,
    response_comment = nullif(btrim(p_comment), ''),
    responded_at = now(),
    responded_by = auth.uid()
  where id = p_entry_id;
end;
$$;

revoke all on function public.respond_convocation(uuid, public.convocation_response, text) from public;
grant execute on function public.respond_convocation(uuid, public.convocation_response, text) to authenticated;

create trigger convocations_updated_at
  before update on public.convocations
  for each row execute function public.set_updated_at();

-- Saison active par défaut
insert into public.seasons (name, start_date, end_date, is_active)
select 'Saison 2025-2026', '2025-09-01', '2026-08-31', true
where not exists (select 1 from public.seasons where is_active = true);
