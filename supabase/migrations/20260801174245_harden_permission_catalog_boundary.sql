revoke all on table public.app_roles from public, anon, authenticated, service_role;
revoke all on table public.app_permissions from public, anon, authenticated, service_role;
revoke all on table public.app_role_permissions from public, anon, authenticated, service_role;

grant select on table public.app_roles to service_role;
grant select on table public.app_permissions to service_role;
grant select on table public.app_role_permissions to service_role;

drop policy if exists "active users can read app roles" on public.app_roles;
drop policy if exists "active users can read app permissions" on public.app_permissions;
drop policy if exists "active users can read app role permissions" on public.app_role_permissions;

insert into public.app_permissions (key, label, description)
values
	('prices.manage', 'Gerenciar preços', 'Permite criar novas versões de tabelas de preço.'),
	('rules.manage', 'Gerenciar regras', 'Permite criar novas versões de regras comerciais.')
on conflict (key) do update
set
	label = excluded.label,
	description = excluded.description,
	updated_at = now();

insert into public.app_role_permissions (role_key, permission_key)
values
	('admin', 'prices.manage'),
	('admin', 'rules.manage')
on conflict (role_key, permission_key) do nothing;

delete from public.app_permissions
where key = 'clients.sync.read';

drop policy if exists "permitted users can read client sync runs" on public.client_sync_runs;
create policy "permitted users can read client sync runs"
on public.client_sync_runs
for select
to authenticated
using (
	(select private.has_current_user_permission('sync.execute'))
	or (select private.has_current_user_permission('audit.read'))
);

drop policy if exists "permitted users can read client sync state" on public.client_sync_state;
create policy "permitted users can read client sync state"
on public.client_sync_state
for select
to authenticated
using (
	(select private.has_current_user_permission('sync.execute'))
	or (select private.has_current_user_permission('audit.read'))
);
