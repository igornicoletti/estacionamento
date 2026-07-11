create extension if not exists pgcrypto;

do $$ begin
  create type public.app_user_role as enum ('owner', 'admin', 'auditor', 'manager', 'operator');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_user_status as enum ('pending', 'active', 'inactive', 'password_reset', 'passkey_reset');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_scope as enum ('login', 'system');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_severity as enum ('info', 'warning', 'critical');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  technical_email text not null unique,
  name text not null check (char_length(trim(name)) >= 3),
  cpf_hmac text not null unique,
  cpf_masked text not null,
  phone_masked text not null,
  phone_verified_at timestamptz,
  pending_phone_masked text,
  email text,
  email_verified_at timestamptz,
  role public.app_user_role not null,
  status public.app_user_status not null default 'pending',
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  last_failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create table if not exists public.app_user_units (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null unique references public.app_users(id) on delete cascade,
  unit_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_flow_attempts (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null unique default gen_random_uuid(),
  cpf_hmac text not null,
  app_user_id uuid references public.app_users(id) on delete set null,
  purpose text not null check (purpose in ('login', 'first_access', 'password_reset', 'passkey_reset')),
  consumed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  request_ip_hash text,
  user_agent_hash text
);

create table if not exists public.auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  key_hash text not null,
  attempts integer not null default 1 check (attempts >= 0),
  locked_until timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (bucket, key_hash)
);

create table if not exists public.phone_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  phone_masked text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.email_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_users_auth_user_id_idx on public.app_users(auth_user_id);
create index if not exists app_users_cpf_hmac_idx on public.app_users(cpf_hmac);
create index if not exists app_user_units_unit_id_idx on public.app_user_units(unit_id);
create index if not exists auth_flow_attempts_flow_id_idx on public.auth_flow_attempts(flow_id);
