create table if not exists public.permission_groups (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (char_length(trim(label)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.permission_groups(id) on delete restrict,
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  label text not null check (char_length(trim(label)) > 0),
  description text,
  source text not null default 'system' check (source in ('system', 'custom')),
  is_critical boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.app_user_role not null,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (role, permission_id)
);

alter table public.permission_groups enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

revoke all on table public.permission_groups from public, anon, authenticated;
revoke all on table public.permissions from public, anon, authenticated;
revoke all on table public.role_permissions from public, anon, authenticated;

grant select on table public.permission_groups to authenticated;
grant select on table public.permissions to authenticated;
grant select on table public.role_permissions to authenticated;
grant select, insert, update, delete on table public.permission_groups to service_role;
grant select, insert, update, delete on table public.permissions to service_role;
grant select, insert, update, delete on table public.role_permissions to service_role;

create index if not exists permission_groups_sort_idx
on public.permission_groups(sort_order, label);

create index if not exists permissions_group_sort_idx
on public.permissions(group_id, sort_order, label)
where is_active = true;

create index if not exists permissions_key_idx
on public.permissions(key);

create index if not exists permissions_source_idx
on public.permissions(source)
where is_active = true;

create index if not exists role_permissions_permission_idx
on public.role_permissions(permission_id);

create index if not exists role_permissions_role_idx
on public.role_permissions(role);

create or replace function public.can_read_permissions()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users actor
    where actor.auth_user_id = (select auth.uid())
      and actor.status = 'active'
      and actor.role in ('owner', 'admin', 'auditor')
  );
$$;

revoke all on function public.can_read_permissions() from public, anon, authenticated;
grant execute on function public.can_read_permissions() to authenticated;

drop policy if exists "authorized users can read permission groups" on public.permission_groups;
create policy "authorized users can read permission groups"
on public.permission_groups
for select
to authenticated
using ((select auth.uid()) is not null and public.can_read_permissions());

drop policy if exists "authorized users can read permissions" on public.permissions;
create policy "authorized users can read permissions"
on public.permissions
for select
to authenticated
using ((select auth.uid()) is not null and public.can_read_permissions());

drop policy if exists "authorized users can read role permissions" on public.role_permissions;
create policy "authorized users can read role permissions"
on public.role_permissions
for select
to authenticated
using ((select auth.uid()) is not null and public.can_read_permissions());

insert into public.permission_groups (key, label, sort_order)
values
  ('profile', 'Perfil', 10),
  ('settings', 'Configurações', 20),
  ('notifications', 'Notificações', 30),
  ('units', 'Unidades', 40),
  ('clients', 'Clientes', 50),
  ('client_vehicles', 'Veículos de clientes', 60),
  ('prices', 'Preços', 70),
  ('rules', 'Regras', 80),
  ('users', 'Usuários', 90),
  ('access_requests', 'Solicitações de acesso', 100),
  ('permissions', 'Permissões', 110),
  ('audit', 'Auditoria', 120)
on conflict (key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  updated_at = now();

with permission_seed (group_key, key, label, description, is_critical, sort_order) as (
  values
    ('profile', 'profile.read_self', 'Visualizar próprio perfil', 'Permite visualizar dados do próprio perfil.', false, 10),
    ('settings', 'settings.read_self', 'Visualizar próprias configurações', 'Permite visualizar configurações da própria conta.', false, 20),
    ('notifications', 'notifications.read', 'Visualizar notificações', 'Permite visualizar notificações entregues ao usuário.', false, 30),
    ('units', 'units.read', 'Visualizar unidades', 'Permite visualizar unidades disponíveis.', false, 40),
    ('clients', 'clients.read', 'Visualizar clientes', 'Permite visualizar clientes.', false, 50),
    ('client_vehicles', 'client_vehicles.read', 'Visualizar veículos de clientes', 'Permite visualizar veículos vinculados a clientes.', false, 60),
    ('prices', 'prices.read', 'Visualizar preços', 'Permite visualizar tabelas de preço.', false, 70),
    ('rules', 'rules.read', 'Visualizar regras', 'Permite visualizar regras comerciais.', false, 80),
    ('users', 'users.read', 'Visualizar usuários', 'Permite visualizar o diretório de usuários.', true, 90),
    ('users', 'users.manage', 'Gerenciar usuários', 'Permite criar, editar e aplicar ações administrativas em usuários.', true, 100),
    ('access_requests', 'access_requests.read', 'Visualizar solicitações de acesso', 'Permite visualizar solicitações de recuperação e alteração de acesso.', true, 110),
    ('access_requests', 'access_requests.review', 'Revisar solicitações de acesso', 'Permite aprovar ou negar solicitações de recuperação e alteração de acesso.', true, 120),
    ('permissions', 'permissions.read', 'Visualizar permissões', 'Permite visualizar a matriz de permissões.', true, 130),
    ('audit', 'audit.read', 'Visualizar auditoria', 'Permite visualizar eventos de auditoria.', true, 140)
)
insert into public.permissions (group_id, key, label, description, is_critical, sort_order)
select permission_groups.id, permission_seed.key, permission_seed.label, permission_seed.description, permission_seed.is_critical, permission_seed.sort_order
from permission_seed
join public.permission_groups on permission_groups.key = permission_seed.group_key
on conflict (key) do update set
  description = excluded.description,
  group_id = excluded.group_id,
  is_active = true,
  is_critical = excluded.is_critical,
  label = excluded.label,
  sort_order = excluded.sort_order,
  source = 'system',
  updated_at = now();

with role_permission_seed (role, permission_key) as (
  values
    ('owner'::public.app_user_role, 'profile.read_self'),
    ('owner'::public.app_user_role, 'settings.read_self'),
    ('owner'::public.app_user_role, 'notifications.read'),
    ('owner'::public.app_user_role, 'units.read'),
    ('owner'::public.app_user_role, 'clients.read'),
    ('owner'::public.app_user_role, 'client_vehicles.read'),
    ('owner'::public.app_user_role, 'prices.read'),
    ('owner'::public.app_user_role, 'rules.read'),
    ('owner'::public.app_user_role, 'users.read'),
    ('owner'::public.app_user_role, 'users.manage'),
    ('owner'::public.app_user_role, 'access_requests.read'),
    ('owner'::public.app_user_role, 'access_requests.review'),
    ('owner'::public.app_user_role, 'permissions.read'),
    ('owner'::public.app_user_role, 'audit.read'),
    ('admin'::public.app_user_role, 'profile.read_self'),
    ('admin'::public.app_user_role, 'settings.read_self'),
    ('admin'::public.app_user_role, 'notifications.read'),
    ('admin'::public.app_user_role, 'units.read'),
    ('admin'::public.app_user_role, 'clients.read'),
    ('admin'::public.app_user_role, 'client_vehicles.read'),
    ('admin'::public.app_user_role, 'prices.read'),
    ('admin'::public.app_user_role, 'rules.read'),
    ('admin'::public.app_user_role, 'users.read'),
    ('admin'::public.app_user_role, 'users.manage'),
    ('admin'::public.app_user_role, 'access_requests.read'),
    ('admin'::public.app_user_role, 'access_requests.review'),
    ('admin'::public.app_user_role, 'permissions.read'),
    ('admin'::public.app_user_role, 'audit.read'),
    ('auditor'::public.app_user_role, 'profile.read_self'),
    ('auditor'::public.app_user_role, 'settings.read_self'),
    ('auditor'::public.app_user_role, 'notifications.read'),
    ('auditor'::public.app_user_role, 'units.read'),
    ('auditor'::public.app_user_role, 'clients.read'),
    ('auditor'::public.app_user_role, 'client_vehicles.read'),
    ('auditor'::public.app_user_role, 'prices.read'),
    ('auditor'::public.app_user_role, 'rules.read'),
    ('auditor'::public.app_user_role, 'users.read'),
    ('auditor'::public.app_user_role, 'access_requests.read'),
    ('auditor'::public.app_user_role, 'permissions.read'),
    ('auditor'::public.app_user_role, 'audit.read'),
    ('manager'::public.app_user_role, 'profile.read_self'),
    ('manager'::public.app_user_role, 'settings.read_self'),
    ('manager'::public.app_user_role, 'notifications.read'),
    ('manager'::public.app_user_role, 'units.read'),
    ('manager'::public.app_user_role, 'clients.read'),
    ('manager'::public.app_user_role, 'client_vehicles.read'),
    ('manager'::public.app_user_role, 'prices.read'),
    ('manager'::public.app_user_role, 'rules.read'),
    ('manager'::public.app_user_role, 'users.read'),
    ('operator'::public.app_user_role, 'profile.read_self'),
    ('operator'::public.app_user_role, 'settings.read_self'),
    ('operator'::public.app_user_role, 'notifications.read'),
    ('operator'::public.app_user_role, 'units.read'),
    ('operator'::public.app_user_role, 'clients.read'),
    ('operator'::public.app_user_role, 'client_vehicles.read'),
    ('operator'::public.app_user_role, 'prices.read'),
    ('operator'::public.app_user_role, 'rules.read')
)
insert into public.role_permissions (role, permission_id)
select role_permission_seed.role, permissions.id
from role_permission_seed
join public.permissions on permissions.key = role_permission_seed.permission_key
on conflict (role, permission_id) do nothing;
