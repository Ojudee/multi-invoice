create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists memberships_user_id_idx on public.memberships (user_id);

create table if not exists public.organization_data (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  storage_key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (organization_id, storage_key)
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.organization_data enable row level security;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_organization_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_organization_id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
  );
$$;

create policy "Profiles are visible to self and organization admins"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.memberships own_membership
    join public.memberships peer_membership
      on peer_membership.organization_id = own_membership.organization_id
    where own_membership.user_id = (select auth.uid())
      and peer_membership.user_id = profiles.id
      and public.is_organization_admin(own_membership.organization_id)
  )
);

create policy "Organizations are visible to members"
on public.organizations for select to authenticated
using (public.is_organization_member(id));

create policy "Memberships are visible to organization members"
on public.memberships for select to authenticated
using (public.is_organization_member(organization_id));

create policy "Organization data is visible to members"
on public.organization_data for select to authenticated
using (public.is_organization_member(organization_id));

create policy "Organization data can be written by members"
on public.organization_data for insert to authenticated
with check (public.is_organization_member(organization_id));

create policy "Organization data can be updated by members"
on public.organization_data for update to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "Organization data can be deleted by members"
on public.organization_data for delete to authenticated
using (public.is_organization_member(organization_id));

create or replace function public.assign_first_univision_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  univision_organization_id uuid;
begin
  perform pg_advisory_xact_lock(814223, 1);
  if exists (select 1 from public.memberships) then
    return;
  end if;

  select o.id
    into univision_organization_id
    from public.organizations o
    where o.name = 'Univision Design and Construction Ltd.'
    order by o.created_at, o.id
    limit 1;

  if univision_organization_id is null then
    insert into public.organizations (name, company)
    values (
      'Univision Design and Construction Ltd.',
      '{
        "name": "UNIVISION",
        "tagline": "DESIGN AND CONSTRUCTION LTD.",
        "slogan": "Build Your Vision With Us",
        "phone": "+220 872104724",
        "email": "univision0111@gmail.com",
        "address": "Sukuta-jabang Highway, Sukuta Dalaba",
        "bannerTitle": "ARCHITECTURAL & STRUCTURAL ENGINEERING SERVICES",
        "bannerValues": "PROFESSIONAL | ACCURATE | RELIABLE | FAST TURNAROUND",
        "footerQuote": "Building Today, Designing Tomorrow"
      }'::jsonb
    )
    returning id into univision_organization_id;
  end if;

  insert into public.memberships (organization_id, user_id, role)
  values (univision_organization_id, target_user_id, 'admin')
  on conflict (organization_id, user_id) do nothing;
end;
$$;

create or replace function public.handle_new_server_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  if new.email_confirmed_at is not null then
    perform public.assign_first_univision_admin(new.id);
  end if;

  return new;
end;
$$;

create or replace function public.handle_server_account_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.assign_first_univision_admin(new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_server_account on auth.users;
create trigger on_auth_user_created_server_account
after insert on auth.users
for each row execute function public.handle_new_server_account();

drop trigger if exists on_auth_user_confirmed_server_account on auth.users;
create trigger on_auth_user_confirmed_server_account
after update of email_confirmed_at on auth.users
for each row execute function public.handle_server_account_confirmation();

create or replace function public.create_organization(
  source_organization_id uuid,
  organization_name text,
  company_profile jsonb
)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_organization public.organizations;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in is required.';
  end if;
  if not public.is_organization_admin(source_organization_id) then
    raise exception 'An organization administrator is required to create an organization.';
  end if;
  if nullif(trim(organization_name), '') is null then
    raise exception 'Enter an organization name.';
  end if;
  if company_profile is null or jsonb_typeof(company_profile) <> 'object' then
    raise exception 'A valid company profile is required.';
  end if;

  insert into public.organizations (name, company)
  values (trim(organization_name), company_profile)
  returning * into created_organization;

  insert into public.memberships (organization_id, user_id, role)
  values (created_organization.id, (select auth.uid()), 'admin');

  return created_organization;
end;
$$;

create or replace function public.add_organization_member(
  p_organization_id uuid,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_profile public.profiles;
begin
  if not public.is_organization_admin(p_organization_id) then
    raise exception 'Only an administrator of this organization can add members.';
  end if;

  select p.*
    into target_profile
    from public.profiles p
    where p.email = lower(trim(p_email));
  if target_profile.id is null then
    raise exception 'No registered account was found for that email. Ask the person to sign up first.';
  end if;

  insert into public.memberships (organization_id, user_id, role)
  values (p_organization_id, target_profile.id, 'member')
  on conflict (organization_id, user_id) do nothing;

  return jsonb_build_object(
    'id', target_profile.id,
    'name', target_profile.full_name,
    'email', target_profile.email,
    'role', 'member'
  );
end;
$$;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_admin(uuid) from public;
revoke all on function public.assign_first_univision_admin(uuid) from public;
revoke all on function public.handle_new_server_account() from public;
revoke all on function public.handle_server_account_confirmation() from public;
revoke all on function public.create_organization(uuid, text, jsonb) from public;
revoke all on function public.add_organization_member(uuid, text) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;
grant execute on function public.create_organization(uuid, text, jsonb) to authenticated;
grant execute on function public.add_organization_member(uuid, text) to authenticated;

grant select on public.profiles to authenticated;
grant select on public.organizations to authenticated;
grant select on public.memberships to authenticated;
grant select, insert, update, delete on public.organization_data to authenticated;
