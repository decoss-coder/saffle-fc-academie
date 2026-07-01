-- Super administrateur plateforme (Boty Dia Armel) + droits RLS étendus

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.phone_registry pr on pr.linked_user_id = p.id
    where p.id = auth.uid()
      and (
        coalesce(p.phone, pr.phone_normalized) = '+2250707189702'
        or lower(coalesce(p.full_name, pr.full_name, '')) = 'boty dia armel'
      )
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.is_super_admin() then 'admin'::public.user_role
    else (select role from public.profiles where id = auth.uid())
  end;
$$;
