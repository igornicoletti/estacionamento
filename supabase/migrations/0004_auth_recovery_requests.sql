do $$ begin
  create type public.access_recovery_reason as enum ('lost_phone', 'forgot_password', 'attempts_blocked', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.access_recovery_status as enum ('pending', 'approved', 'denied', 'completed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.access_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  cpf_hmac text not null,
  phone_masked text not null,
  email text,
  reason public.access_recovery_reason not null,
  description text,
  status public.access_recovery_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_reason text,
  request_ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index if not exists access_recovery_requests_status_idx
on public.access_recovery_requests(status, created_at desc);

alter table public.access_recovery_requests enable row level security;

grant select on public.access_recovery_requests to authenticated;

drop policy if exists "authorized roles can read recovery requests" on public.access_recovery_requests;
create policy "authorized roles can read recovery requests"
on public.access_recovery_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin')
  )
);
