create table if not exists public.app_roles (
  key public.app_user_role primary key,
  label text not null check (char_length(trim(label)) > 0),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_permissions (
  key text primary key check (key = '*' or key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  label text not null check (char_length(trim(label)) > 0),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_role_permissions (
  role_key public.app_user_role not null references public.app_roles(key) on delete cascade,
  permission_key text not null references public.app_permissions(key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_key, permission_key)
);

alter table public.app_roles enable row level security;
alter table public.app_permissions enable row level security;
alter table public.app_role_permissions enable row level security;

revoke all on table public.app_roles from public, anon, authenticated;
revoke all on table public.app_permissions from public, anon, authenticated;
revoke all on table public.app_role_permissions from public, anon, authenticated;

grant select on table public.app_roles to authenticated;
grant select on table public.app_permissions to authenticated;
grant select on table public.app_role_permissions to authenticated;
grant select, insert, update, delete on table public.app_roles to service_role;
grant select, insert, update, delete on table public.app_permissions to service_role;
grant select, insert, update, delete on table public.app_role_permissions to service_role;

drop policy if exists "active users can read app roles" on public.app_roles;
create policy "active users can read app roles"
on public.app_roles
for select
to authenticated
using (private.current_user_status() = 'active');

drop policy if exists "active users can read app permissions" on public.app_permissions;
create policy "active users can read app permissions"
on public.app_permissions
for select
to authenticated
using (private.current_user_status() = 'active');

drop policy if exists "active users can read app role permissions" on public.app_role_permissions;
create policy "active users can read app role permissions"
on public.app_role_permissions
for select
to authenticated
using (private.current_user_status() = 'active');

insert into public.app_roles (key, label, description)
values
  ('owner', 'Proprietário', 'Acesso administrativo máximo do sistema.'),
  ('admin', 'Administrador', 'Administração operacional e gestão de acessos.'),
  ('auditor', 'Auditor', 'Consulta e auditoria sem operação administrativa crítica.'),
  ('manager', 'Gestor', 'Gestão operacional dos módulos comerciais e cadastros.'),
  ('operator', 'Operador', 'Operação diária com acesso limitado a consultas necessárias.')
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  updated_at = now();

insert into public.app_permissions (key, label, description)
values
  ('*', 'Todas as permissões', 'Permissão técnica reservada ao proprietário.'),
  ('profile.read_self', 'Ler próprio perfil', 'Permite consultar informações da própria sessão.'),
  ('settings.read_self', 'Ler configurações próprias', 'Permite acessar preferências e segurança da própria conta.'),
  ('notifications.read', 'Ler notificações', 'Permite consultar notificações entregues ao usuário.'),
  ('units.read', 'Ler unidades', 'Permite consultar unidades sincronizadas.'),
  ('clients.read', 'Ler clientes', 'Permite consultar clientes sincronizados.'),
  ('client_vehicles.read', 'Ler veículos de clientes', 'Permite consultar veículos vinculados a clientes.'),
  ('prices.read', 'Ler preços', 'Permite consultar políticas e tabelas de preços.'),
  ('rules.read', 'Ler regras', 'Permite consultar regras comerciais.'),
  ('users.read', 'Ler usuários', 'Permite consultar usuários do sistema.'),
  ('users.manage', 'Gerenciar usuários', 'Permite executar ações administrativas sobre usuários.'),
  ('access_requests.read', 'Ler solicitações de acesso', 'Permite consultar solicitações de recuperação de acesso.'),
  ('access_requests.review', 'Analisar solicitações de acesso', 'Permite aprovar ou negar solicitações de recuperação.'),
  ('permissions.read', 'Ler permissões', 'Permite consultar papéis, permissões e políticas de acesso.'),
  ('audit.read', 'Ler auditoria', 'Permite consultar eventos de auditoria e segurança.')
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  updated_at = now();

insert into public.app_role_permissions (role_key, permission_key)
values
  ('owner', '*'),
  ('admin', 'profile.read_self'),
  ('admin', 'settings.read_self'),
  ('admin', 'notifications.read'),
  ('admin', 'units.read'),
  ('admin', 'clients.read'),
  ('admin', 'client_vehicles.read'),
  ('admin', 'prices.read'),
  ('admin', 'rules.read'),
  ('admin', 'users.read'),
  ('admin', 'users.manage'),
  ('admin', 'access_requests.read'),
  ('admin', 'access_requests.review'),
  ('admin', 'permissions.read'),
  ('admin', 'audit.read'),
  ('auditor', 'profile.read_self'),
  ('auditor', 'settings.read_self'),
  ('auditor', 'notifications.read'),
  ('auditor', 'units.read'),
  ('auditor', 'clients.read'),
  ('auditor', 'client_vehicles.read'),
  ('auditor', 'prices.read'),
  ('auditor', 'rules.read'),
  ('auditor', 'users.read'),
  ('auditor', 'permissions.read'),
  ('auditor', 'audit.read'),
  ('manager', 'profile.read_self'),
  ('manager', 'settings.read_self'),
  ('manager', 'notifications.read'),
  ('manager', 'units.read'),
  ('manager', 'clients.read'),
  ('manager', 'client_vehicles.read'),
  ('manager', 'prices.read'),
  ('manager', 'rules.read'),
  ('operator', 'profile.read_self'),
  ('operator', 'settings.read_self'),
  ('operator', 'notifications.read'),
  ('operator', 'units.read'),
  ('operator', 'clients.read'),
  ('operator', 'client_vehicles.read')
on conflict (role_key, permission_key) do nothing;

create or replace function private.current_user_permissions()
returns text[]
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(array_agg(role_permission.permission_key order by role_permission.permission_key), array[]::text[])
  from public.app_users app_user
  join public.app_role_permissions role_permission
    on role_permission.role_key = app_user.role
  where app_user.auth_user_id = (select auth.uid())
    and app_user.status = 'active';
$$;

revoke all on function private.current_user_permissions() from public, anon, authenticated, service_role;
grant execute on function private.current_user_permissions() to authenticated, service_role;

create or replace function private.get_current_auth_profile()
returns table (
  id uuid,
  auth_user_id uuid,
  name text,
  role_key text,
  role_label text,
  status text,
  permissions text[],
  unit_id text,
  unit_name text,
  phone_masked text,
  cpf_masked text,
  email text,
  avatar_url text,
  passkey_status text
)
language sql
stable
security definer
set search_path = public, private
as $$
  select
    app_user.id,
    app_user.auth_user_id,
    app_user.name,
    app_user.role::text as role_key,
    app_role.label as role_label,
    app_user.status::text as status,
    case
      when app_user.status = 'active' then private.current_user_permissions()
      else array[]::text[]
    end as permissions,
    unit_link.unit_id,
    null::text as unit_name,
    app_user.phone_masked,
    app_user.cpf_masked,
    app_user.email,
    null::text as avatar_url,
    'inactive'::text as passkey_status
  from public.app_users app_user
  left join public.app_roles app_role
    on app_role.key = app_user.role
  left join public.app_user_units unit_link
    on unit_link.app_user_id = app_user.id
  where app_user.auth_user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function private.get_current_auth_profile() from public, anon, authenticated, service_role;
grant execute on function private.get_current_auth_profile() to authenticated, service_role;

create or replace function public.get_current_auth_profile()
returns table (
  id uuid,
  auth_user_id uuid,
  name text,
  role_key text,
  role_label text,
  status text,
  permissions text[],
  unit_id text,
  unit_name text,
  phone_masked text,
  cpf_masked text,
  email text,
  avatar_url text,
  passkey_status text
)
language sql
stable
security invoker
set search_path = public, private
as $$
  select * from private.get_current_auth_profile();
$$;

revoke all on function public.get_current_auth_profile() from public, anon, authenticated, service_role;
grant execute on function public.get_current_auth_profile() to authenticated;
