-- Executar contra o banco local após `supabase db reset`/`migration up`.
-- O script falha imediatamente quando um contrato estrutural de segurança é violado.

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not c.relrowsecurity
  ) then
    raise exception 'Todas as tabelas public devem ter RLS habilitado.';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and not coalesce(c.reloptions, array[]::text[]) @> array['security_invoker=true']
  ) then
    raise exception 'Views public devem usar security_invoker=true.';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and (
        has_function_privilege('public', p.oid, 'EXECUTE')
        or has_function_privilege('anon', p.oid, 'EXECUTE')
      )
  ) then
    raise exception 'Funções security definer não podem ser executáveis por public/anon.';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) setting
        where setting like 'search_path=%'
      )
  ) then
    raise exception 'Funções security definer devem fixar search_path.';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and cmd in ('UPDATE', 'ALL')
      and (qual is null or with_check is null)
  ) then
    raise exception 'Policies UPDATE/ALL devem declarar USING e WITH CHECK.';
  end if;
end;
$$;

do $$
declare
  private_function oid := to_regprocedure('private.revoke_auth_user_sessions(uuid)');
  public_function oid := to_regprocedure('public.revoke_auth_user_sessions(uuid)');
begin
  if private_function is null or public_function is null then
    raise exception 'Contrato de revogação de sessões ausente.';
  end if;

  if not exists (
    select 1
    from pg_proc
    where oid = private_function
      and prosecdef
  ) then
    raise exception 'Implementação privada de revogação deve usar security definer.';
  end if;

  if exists (
    select 1
    from pg_proc
    where oid = public_function
      and prosecdef
  ) then
    raise exception 'Wrapper público de revogação deve usar security invoker.';
  end if;

  if has_function_privilege('public', public_function, 'EXECUTE')
    or has_function_privilege('anon', public_function, 'EXECUTE')
    or has_function_privilege('authenticated', public_function, 'EXECUTE')
    or not has_function_privilege('service_role', public_function, 'EXECUTE') then
    raise exception 'RPC de revogação deve ser exclusiva do service_role.';
  end if;
end;
$$;

do $$
declare
  public_signature text;
  private_signature text;
  public_function oid;
  private_function oid;
begin
  foreach public_signature in array array[
    'public.touch_current_auth_session(boolean)',
    'public.revoke_current_auth_session(text)',
    'public.get_current_auth_profile()'
  ] loop
    public_function := to_regprocedure(public_signature);

    if public_function is null then
      raise exception 'Wrapper público de sessão ausente: %', public_signature;
    end if;

    if (select prosecdef from pg_proc where oid = public_function) then
      raise exception 'Wrapper público deve usar security invoker: %', public_signature;
    end if;

    if has_function_privilege('public', public_function, 'EXECUTE')
      or has_function_privilege('anon', public_function, 'EXECUTE')
      or not has_function_privilege('authenticated', public_function, 'EXECUTE') then
      raise exception 'Wrapper público possui grants inválidos: %', public_signature;
    end if;
  end loop;

  foreach private_signature in array array[
    'private.touch_current_auth_session(boolean)',
    'private.revoke_current_auth_session(text)',
    'private.get_current_auth_profile()'
  ] loop
    private_function := to_regprocedure(private_signature);

    if private_function is null then
      raise exception 'Implementação privada de sessão ausente: %', private_signature;
    end if;

    if not (select prosecdef from pg_proc where oid = private_function) then
      raise exception 'Implementação privada deve usar security definer: %', private_signature;
    end if;

    if has_function_privilege('public', private_function, 'EXECUTE')
      or has_function_privilege('anon', private_function, 'EXECUTE')
      or not has_function_privilege('authenticated', private_function, 'EXECUTE')
      or not has_function_privilege('service_role', private_function, 'EXECUTE') then
      raise exception 'Implementação privada possui grants inválidos: %', private_signature;
    end if;
  end loop;

  if position(
    'private.is_current_app_session_active()'
    in (select prosrc from pg_proc where oid = to_regprocedure('private.get_current_auth_profile()'))
  ) = 0 then
    raise exception 'Perfil autenticado deve validar a sessão ativa dentro da implementação privada.';
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.audit_events_occurred_id_idx') is null then
    raise exception 'Índice determinístico da auditoria está ausente.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_events'
      and policyname = 'active privileged roles can read audit events'
      and qual like '%SELECT private.has_current_user_permission%'
  ) then
    raise exception 'Policy de auditoria deve avaliar a permissão uma vez por statement.';
  end if;
end;
$$;

do $$
declare
  function_oid oid;
begin
  function_oid := to_regprocedure('private.configure_units_sync_cron(text,text,text,text)');

  if function_oid is null
    or not (select prosecdef from pg_proc where oid = function_oid)
    or not has_function_privilege('service_role', function_oid, 'EXECUTE')
    or has_function_privilege('public', function_oid, 'EXECUTE')
    or has_function_privilege('anon', function_oid, 'EXECUTE')
    or has_function_privilege('authenticated', function_oid, 'EXECUTE')
    or position('private.enqueue_units_sync' in (select prosrc from pg_proc where oid = function_oid)) = 0 then
    raise exception 'Configuração de cron de unidades possui contexto, grants ou helper inválidos.';
  end if;

  function_oid := to_regprocedure('private.configure_clients_sync_cron(text,text,text,text)');

  if function_oid is null
    or not (select prosecdef from pg_proc where oid = function_oid)
    or not has_function_privilege('service_role', function_oid, 'EXECUTE')
    or has_function_privilege('public', function_oid, 'EXECUTE')
    or has_function_privilege('anon', function_oid, 'EXECUTE')
    or has_function_privilege('authenticated', function_oid, 'EXECUTE')
    or position('private.enqueue_clients_sync_phase' in (select prosrc from pg_proc where oid = function_oid)) = 0 then
    raise exception 'Configuração de cron de clientes possui contexto, grants ou fases inválidos.';
  end if;

  function_oid := to_regprocedure('private.enqueue_clients_sync_phase(text,text)');

  if function_oid is null
    or not (select prosecdef from pg_proc where oid = function_oid)
    or has_function_privilege('public', function_oid, 'EXECUTE')
    or has_function_privilege('anon', function_oid, 'EXECUTE')
    or has_function_privilege('authenticated', function_oid, 'EXECUTE')
    or has_function_privilege('service_role', function_oid, 'EXECUTE')
    or position('vault.decrypted_secrets' in (select prosrc from pg_proc where oid = function_oid)) = 0 then
    raise exception 'Enfileirador interno de clientes possui contexto, grants ou Vault inválidos.';
  end if;

  if position('timeout_milliseconds := 145000' in (select prosrc from pg_proc where oid = function_oid)) = 0 then
    raise exception 'Enfileirador de clientes deve declarar timeout compatível com o Edge Runtime.';
  end if;

  function_oid := to_regprocedure('private.enqueue_pending_clients_vehicle_partition()');

  if function_oid is null
    or not (select prosecdef from pg_proc where oid = function_oid)
    or has_function_privilege('public', function_oid, 'EXECUTE')
    or has_function_privilege('anon', function_oid, 'EXECUTE')
    or has_function_privilege('authenticated', function_oid, 'EXECUTE')
    or has_function_privilege('service_role', function_oid, 'EXECUTE')
    or position('vault.decrypted_secrets' in (select prosrc from pg_proc where oid = function_oid)) = 0
    or position('timeout_milliseconds := 145000' in (select prosrc from pg_proc where oid = function_oid)) = 0
    or position('last_cursor' in (select prosrc from pg_proc where oid = function_oid)) = 0 then
    raise exception 'Retomador de veículos possui contexto, grants, Vault, cursor ou timeout inválidos.';
  end if;

  function_oid := to_regprocedure('private.enqueue_units_sync(text)');

  if function_oid is null
    or not (select prosecdef from pg_proc where oid = function_oid)
    or has_function_privilege('public', function_oid, 'EXECUTE')
    or has_function_privilege('anon', function_oid, 'EXECUTE')
    or has_function_privilege('authenticated', function_oid, 'EXECUTE')
    or has_function_privilege('service_role', function_oid, 'EXECUTE')
    or position('vault.decrypted_secrets' in (select prosrc from pg_proc where oid = function_oid)) = 0
    or position('timeout_milliseconds := 30000' in (select prosrc from pg_proc where oid = function_oid)) = 0 then
    raise exception 'Enfileirador interno de unidades possui contexto, grants, Vault ou timeout inválidos.';
  end if;

  function_oid := to_regprocedure('private.upsert_sync_cron_secret(text,text,text)');

  if function_oid is null
    or has_function_privilege('public', function_oid, 'EXECUTE')
    or has_function_privilege('anon', function_oid, 'EXECUTE')
    or has_function_privilege('authenticated', function_oid, 'EXECUTE')
    or has_function_privilege('service_role', function_oid, 'EXECUTE') then
    raise exception 'Helper interno do Vault não deve ser chamável por roles da API.';
  end if;

  if has_table_privilege('anon', 'vault.decrypted_secrets', 'SELECT')
    or has_table_privilege('authenticated', 'vault.decrypted_secrets', 'SELECT') then
    raise exception 'Segredos descriptografados do Vault não podem ser lidos por clientes.';
  end if;

  if exists (
    select 1
    from cron.job
    where jobname like 'unit-sync-%'
      and command not like '%private.enqueue_units_sync%'
  ) then
    raise exception 'Jobs de unidades devem chamar somente o enfileirador interno.';
  end if;

  if exists (
    select 1
    from cron.job
    where jobname like 'client-sync-%'
      and command not like '%private.enqueue_clients_sync_phase%'
      and command not like '%private.enqueue_pending_clients_vehicle_partition%'
  ) then
    raise exception 'Jobs de clientes devem chamar somente os enfileiradores internos.';
  end if;
end;
$$;

do $$
declare
  public_function oid := to_regprocedure('public.list_unit_user_stats()');
  private_function oid := to_regprocedure('private.list_unit_user_stats()');
begin
  if public_function is null or private_function is null then
    raise exception 'Contrato agregado de funcionários por unidade ausente.';
  end if;

  if (select prosecdef from pg_proc where oid = public_function)
    or not (select prosecdef from pg_proc where oid = private_function) then
    raise exception 'RPC de estatísticas deve usar wrapper invoker e implementação privada definer.';
  end if;

  if has_function_privilege('public', public_function, 'EXECUTE')
    or has_function_privilege('anon', public_function, 'EXECUTE')
    or not has_function_privilege('authenticated', public_function, 'EXECUTE') then
    raise exception 'Wrapper de estatísticas possui grants inválidos.';
  end if;

  if has_function_privilege('public', private_function, 'EXECUTE')
    or has_function_privilege('anon', private_function, 'EXECUTE')
    or not has_function_privilege('authenticated', private_function, 'EXECUTE')
    or has_function_privilege('service_role', private_function, 'EXECUTE')
    or position('users.read' in (select prosrc from pg_proc where oid = private_function)) = 0 then
    raise exception 'Implementação privada de estatísticas possui grants ou autorização inválidos.';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from public.app_permissions
    where key = 'units.yard.manage'
  ) or not exists (
    select 1
    from public.app_role_permissions
    where role_key = 'admin'
      and permission_key = 'units.yard.manage'
  ) then
    raise exception 'Permissão de gestão do pátio não foi registrada para administradores.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'erp_units'
      and cmd = 'SELECT'
      and qual like '%units.read%'
  ) or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'unit_yard_configs'
      and cmd = 'SELECT'
      and qual like '%units.read%'
  ) then
    raise exception 'Leituras de unidades e pátio devem exigir units.read.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'unit_yard_configs'
      and cmd = 'UPDATE'
      and qual like '%units.yard.manage%'
      and with_check like '%units.yard.manage%'
  ) then
    raise exception 'Atualização de pátio deve exigir units.yard.manage.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'unit_yard_configs'
      and cmd = 'DELETE'
  ) then
    raise exception 'A aplicação não deve expor exclusão de configuração de pátio.';
  end if;

  if has_table_privilege('anon', 'public.erp_clients', 'SELECT')
    or has_table_privilege('anon', 'public.erp_client_vehicles', 'SELECT')
    or has_table_privilege('anon', 'public.erp_units', 'SELECT')
    or has_table_privilege('anon', 'public.unit_yard_configs', 'SELECT')
    or has_table_privilege('authenticated', 'public.erp_clients', 'TRUNCATE')
    or has_table_privilege('authenticated', 'public.erp_client_vehicles', 'TRUNCATE')
    or has_table_privilege('authenticated', 'public.erp_units', 'TRUNCATE')
    or has_table_privilege('authenticated', 'public.unit_yard_configs', 'TRUNCATE')
    or has_table_privilege('authenticated', 'public.unit_yard_configs', 'DELETE') then
    raise exception 'Grants de clientes/unidades excedem o privilégio mínimo.';
  end if;

  if not has_table_privilege('service_role', 'public.erp_clients', 'SELECT,INSERT,UPDATE')
    or not has_table_privilege('service_role', 'public.erp_client_vehicles', 'SELECT,INSERT,UPDATE')
    or not has_table_privilege('service_role', 'public.erp_units', 'SELECT,INSERT,UPDATE')
    or not has_table_privilege('service_role', 'public.client_sync_runs', 'SELECT,INSERT,UPDATE')
    or not has_table_privilege('service_role', 'public.client_sync_state', 'SELECT,INSERT,UPDATE')
    or not has_table_privilege('service_role', 'public.unit_sync_runs', 'SELECT,INSERT,UPDATE')
    or not has_table_privilege('service_role', 'public.unit_sync_state', 'SELECT,INSERT,UPDATE') then
    raise exception 'Edge Functions de sincronização não possuem os grants mínimos exigidos.';
  end if;
end;
$$;

do $$
declare
  audit_function oid := to_regprocedure('private.audit_unit_yard_config_change()');
  fields_function oid := to_regprocedure('private.set_unit_yard_config_audit_fields()');
begin
  if audit_function is null or fields_function is null then
    raise exception 'Funções de autoria/auditoria do pátio estão ausentes.';
  end if;

  if not (select prosecdef from pg_proc where oid = audit_function)
    or not exists (
      select 1
      from unnest(coalesce((select proconfig from pg_proc where oid = audit_function), array[]::text[])) setting
      where setting = 'search_path=""'
    )
    or has_function_privilege('public', audit_function, 'EXECUTE')
    or has_function_privilege('anon', audit_function, 'EXECUTE')
    or has_function_privilege('authenticated', audit_function, 'EXECUTE')
    or has_function_privilege('service_role', audit_function, 'EXECUTE') then
    raise exception 'Função de auditoria do pátio possui contexto ou grants inválidos.';
  end if;

  if position('updated_by' in (select prosrc from pg_proc where oid = fields_function)) = 0
    or position('auth.uid()' in (select prosrc from pg_proc where oid = fields_function)) = 0 then
    raise exception 'Trigger do pátio deve registrar autoria autenticada.';
  end if;
end;
$$;

select 'security contracts passed' as result;
