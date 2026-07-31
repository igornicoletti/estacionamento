-- Remove the unused local variable reported by plpgsql_check without changing
-- the lock acquisition contract. Historical migrations remain untouched.

create or replace function public.acquire_sync_lock(
  p_resource text,
  p_ttl_seconds integer default 300,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
set search_path to 'public'
as $$
declare
  v_now timestamptz;
  v_expires_at timestamptz;
begin
  if p_resource is null or btrim(p_resource) = '' then
    raise exception 'p_resource is required';
  end if;

  if p_ttl_seconds is null or p_ttl_seconds < 10 then
    p_ttl_seconds := 10;
  end if;

  v_now := now();
  v_expires_at := v_now + make_interval(secs => p_ttl_seconds);

  insert into public.sync_locks (resource, acquired_at, expires_at, metadata)
  values (p_resource, v_now, v_expires_at, coalesce(p_metadata, '{}'::jsonb))
  on conflict (resource) do nothing;

  if found then
    return true;
  end if;

  update public.sync_locks
  set acquired_at = v_now,
      expires_at = v_expires_at,
      metadata = coalesce(p_metadata, '{}'::jsonb)
  where resource = p_resource
    and expires_at <= v_now;

  return found;
end;
$$;

revoke execute on function public.acquire_sync_lock(text, integer, jsonb)
from public, anon, authenticated;

grant execute on function public.acquire_sync_lock(text, integer, jsonb)
to service_role;
