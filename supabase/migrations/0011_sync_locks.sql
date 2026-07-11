create table if not exists public.sync_locks (
  resource text primary key,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

create or replace function public.acquire_sync_lock(
  p_resource text,
  p_ttl_seconds integer default 300,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz;
  v_expires_at timestamptz;
  v_inserted integer;
  v_updated integer;
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
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    return true;
  end if;

  update public.sync_locks
  set acquired_at = v_now,
      expires_at = v_expires_at,
      metadata = coalesce(p_metadata, '{}'::jsonb)
  where resource = p_resource
    and expires_at <= v_now;

  get diagnostics v_updated = row_count;

  return v_updated > 0;
end;
$$;

create or replace function public.release_sync_lock(
  p_resource text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_resource is null or btrim(p_resource) = '' then
    raise exception 'p_resource is required';
  end if;

  delete from public.sync_locks
  where resource = p_resource;
end;
$$;

revoke all on table public.sync_locks from public, anon, authenticated;
grant all on table public.sync_locks to service_role;

revoke execute on function public.acquire_sync_lock(text, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.release_sync_lock(text) from public, anon, authenticated;
grant execute on function public.acquire_sync_lock(text, integer, jsonb) to service_role;
grant execute on function public.release_sync_lock(text) to service_role;
