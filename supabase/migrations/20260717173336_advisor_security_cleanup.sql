create schema if not exists extensions;

create extension if not exists btree_gist with schema extensions;
alter extension btree_gist set schema extensions;

do $$
declare
  internal_table text;
begin
  foreach internal_table in array array[
    'app_session_activity',
    'auth_flow_attempts',
    'auth_rate_limits',
    'email_verification_attempts',
    'phone_verification_attempts',
    'sync_locks'
  ]
  loop
    execute format('alter table public.%I enable row level security', internal_table);
    execute format('drop policy if exists "deny direct client access" on public.%I', internal_table);
    execute format(
      'create policy "deny direct client access" on public.%I for all to anon, authenticated using (false) with check (false)',
      internal_table
    );
  end loop;
end;
$$;
