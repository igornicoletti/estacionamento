drop policy if exists "active users can read unit sync runs" on public.unit_sync_runs;
drop policy if exists "permitted users can read unit sync runs" on public.unit_sync_runs;
create policy "permitted users can read unit sync runs"
on public.unit_sync_runs
for select
to authenticated
using (
	(select private.has_current_user_permission('sync.execute'))
	or (select private.has_current_user_permission('audit.read'))
);

drop policy if exists "active users can read unit sync state" on public.unit_sync_state;
drop policy if exists "permitted users can read unit sync state" on public.unit_sync_state;
create policy "permitted users can read unit sync state"
on public.unit_sync_state
for select
to authenticated
using (
	(select private.has_current_user_permission('sync.execute'))
	or (select private.has_current_user_permission('audit.read'))
);
