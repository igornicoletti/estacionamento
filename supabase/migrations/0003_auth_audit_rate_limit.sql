create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  scope public.audit_scope not null,
  event text not null,
  actor text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  target text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  success boolean not null,
  severity public.audit_severity not null default 'info',
  reason text,
  request_id text,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists audit_events_scope_occurred_idx
on public.audit_events(scope, occurred_at desc);

alter table public.audit_events enable row level security;

grant select on public.audit_events to authenticated;

drop policy if exists "authorized roles can read audit events" on public.audit_events;
create policy "authorized roles can read audit events"
on public.audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin', 'auditor')
  )
);
