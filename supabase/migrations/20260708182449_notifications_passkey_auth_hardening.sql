alter table public.app_users
  add column if not exists pending_phone_display text;

comment on column public.app_users.pending_phone_display is
  'Telefone completo pendente de aprovação administrativa. Não usar para busca; manter phone_masked para logs e cpf_hmac para deduplicação.';

update public.app_users
set
  cpf_display = coalesce(cpf_display, '421.403.248-97'),
  phone_display = coalesce(phone_display, '(17) 99130-4197')
where
  lower(name) = lower('Igor Nicoletti')
  or lower(coalesce(email, '')) = lower('igor.nicoletti@redemontecarlo.com');

create table if not exists public.app_session_activity (
  session_id uuid primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.app_session_activity enable row level security;

revoke all on table public.app_session_activity from public, anon, authenticated;
grant select, insert, update, delete on table public.app_session_activity to service_role;

create index if not exists app_session_activity_user_seen_idx
on public.app_session_activity(auth_user_id, last_seen_at desc);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('system', 'security', 'sync')),
  title text not null check (char_length(trim(title)) > 0),
  description text not null check (char_length(trim(description)) > 0),
  href text check (href is null or (href like '/%' and href not like '//%')),
  source text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by_app_user_id uuid references public.app_users(id) on delete set null
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events(id) on delete cascade,
  recipient_app_user_id uuid not null references public.app_users(id) on delete cascade,
  recipient_auth_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_role public.app_user_role not null,
  recipient_unit_id text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, recipient_app_user_id)
);

alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on table public.notification_events from public, anon, authenticated;
revoke all on table public.notification_deliveries from public, anon, authenticated;
grant select on table public.notification_events to authenticated;
grant select on table public.notification_deliveries to authenticated;
grant select, insert, update, delete on table public.notification_events to service_role;
grant select, insert, update, delete on table public.notification_deliveries to service_role;

create index if not exists notification_deliveries_recipient_created_idx
on public.notification_deliveries(recipient_auth_user_id, created_at desc);

create index if not exists notification_deliveries_recipient_unread_idx
on public.notification_deliveries(recipient_auth_user_id, created_at desc)
where read_at is null;

drop policy if exists "users can read delivered notification events" on public.notification_events;
create policy "users can read delivered notification events"
on public.notification_events
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and exists (
    select 1
    from public.notification_deliveries delivery
    where delivery.event_id = notification_events.id
      and delivery.recipient_auth_user_id = (select auth.uid())
  )
);

drop policy if exists "users can read own notification deliveries" on public.notification_deliveries;
create policy "users can read own notification deliveries"
on public.notification_deliveries
for select
to authenticated
using (
  public.current_user_status() = 'active'
  and recipient_auth_user_id = (select auth.uid())
);

create or replace function public.set_notification_read_status(
  delivery_id uuid,
  is_read boolean
)
returns table(id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_user_status() <> 'active' then
    return;
  end if;

  return query
    update public.notification_deliveries delivery
    set read_at = case when is_read then now() else null end
    where delivery.id = set_notification_read_status.delivery_id
      and delivery.recipient_auth_user_id = auth.uid()
    returning delivery.id;
end;
$$;

create or replace function public.set_notifications_read_status(
  delivery_ids uuid[],
  is_read boolean
)
returns table(id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_user_status() <> 'active' then
    return;
  end if;

  return query
    update public.notification_deliveries delivery
    set read_at = case when is_read then now() else null end
    where delivery.id = any(set_notifications_read_status.delivery_ids)
      and delivery.recipient_auth_user_id = auth.uid()
    returning delivery.id;
end;
$$;

revoke all on function public.set_notification_read_status(uuid, boolean) from public, anon, authenticated;
revoke all on function public.set_notifications_read_status(uuid[], boolean) from public, anon, authenticated;
grant execute on function public.set_notification_read_status(uuid, boolean) to authenticated;
grant execute on function public.set_notifications_read_status(uuid[], boolean) to authenticated;

create or replace function private.create_notification_event(
  notification_type text,
  notification_title text,
  notification_description text,
  notification_href text default null,
  target_roles public.app_user_role[] default null,
  target_auth_user_id uuid default null,
  target_unit_id text default null,
  notification_source text default 'system',
  notification_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  new_event_id uuid;
begin
  insert into public.notification_events (
    type,
    title,
    description,
    href,
    source,
    metadata
  )
  values (
    notification_type,
    notification_title,
    notification_description,
    notification_href,
    notification_source,
    coalesce(notification_metadata, '{}'::jsonb)
  )
  returning id into new_event_id;

  insert into public.notification_deliveries (
    event_id,
    recipient_app_user_id,
    recipient_auth_user_id,
    recipient_role,
    recipient_unit_id
  )
  select
    new_event_id,
    app_user.id,
    app_user.auth_user_id,
    app_user.role,
    unit_link.unit_id
  from public.app_users app_user
  left join public.app_user_units unit_link
    on unit_link.app_user_id = app_user.id
  where app_user.status = 'active'
    and (target_auth_user_id is null or app_user.auth_user_id = target_auth_user_id)
    and (target_roles is null or app_user.role = any(target_roles))
    and (target_unit_id is null or unit_link.unit_id = target_unit_id)
  on conflict do nothing;

  return new_event_id;
end;
$$;

revoke all on function private.create_notification_event(
  text,
  text,
  text,
  text,
  public.app_user_role[],
  uuid,
  text,
  text,
  jsonb
) from public, anon, authenticated;
grant execute on function private.create_notification_event(
  text,
  text,
  text,
  text,
  public.app_user_role[],
  uuid,
  text,
  text,
  jsonb
) to service_role;

create or replace function private.dispatch_audit_notification()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.event = 'access_recovery_requested' then
    perform private.create_notification_event(
      'security',
      'Solicitação de recuperação de acesso',
      'Uma solicitação de recuperação de acesso foi registrada e aguarda análise.',
      '/solicitacoes-acesso',
      array['owner', 'admin']::public.app_user_role[],
      null,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event = 'account_locked' then
    perform private.create_notification_event(
      'security',
      'Conta bloqueada por tentativas inválidas',
      'A conta de ' || new.target || ' foi bloqueada temporariamente após tentativas sem sucesso.',
      '/usuarios',
      array['owner', 'admin', 'auditor']::public.app_user_role[],
      null,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event in (
    'password_reset_requested',
    'passkey_reset_requested',
    'sessions_revoked',
    'user_blocked',
    'user_unblocked',
    'temporary_lock_cleared'
  ) and new.target_user_id is not null then
    perform private.create_notification_event(
      'security',
      case new.event
        when 'password_reset_requested' then 'Redefinição de senha solicitada'
        when 'passkey_reset_requested' then 'Recadastro de passkey solicitado'
        when 'sessions_revoked' then 'Sessões revogadas'
        when 'user_blocked' then 'Usuário bloqueado'
        when 'user_unblocked' then 'Usuário desbloqueado'
        else 'Bloqueio removido'
      end,
      'Uma ação administrativa foi aplicada à sua conta.',
      '/perfil',
      null,
      new.target_user_id,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event in (
    'password_changed',
    'passkey_registered',
    'phone_change_reviewed',
    'access_recovery_reviewed'
  ) and new.target_user_id is not null then
    perform private.create_notification_event(
      'security',
      case new.event
        when 'password_changed' then 'Senha alterada'
        when 'passkey_registered' then 'Passkey cadastrada'
        when 'phone_change_reviewed' then 'Solicitação de telefone analisada'
        else 'Solicitação de recuperação analisada'
      end,
      'Uma atualização de segurança foi registrada na sua conta.',
      '/perfil',
      null,
      new.target_user_id,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event = 'phone_change_requested' then
    perform private.create_notification_event(
      'security',
      'Solicitação de alteração de telefone',
      new.target || ' solicitou alteração do telefone de contato.',
      '/usuarios',
      array['owner', 'admin']::public.app_user_role[],
      null,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  elsif new.event in ('user_created', 'user_updated') then
    perform private.create_notification_event(
      'system',
      case new.event
        when 'user_created' then 'Usuário criado'
        else 'Usuário atualizado'
      end,
      'O cadastro de ' || new.target || ' foi alterado.',
      '/usuarios',
      array['owner', 'admin', 'auditor']::public.app_user_role[],
      null,
      null,
      'audit',
      jsonb_build_object('audit_event_id', new.id, 'event', new.event)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists audit_events_dispatch_notification on public.audit_events;
create trigger audit_events_dispatch_notification
after insert on public.audit_events
for each row
execute function private.dispatch_audit_notification();

revoke all on function private.dispatch_audit_notification() from public, anon, authenticated;
grant execute on function private.dispatch_audit_notification() to service_role;
