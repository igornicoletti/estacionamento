begin;

do $$
begin
  if exists (
    select 1
    from auth.sessions auth_session
    left join public.app_session_activity activity
      on activity.session_id = auth_session.id
      and activity.auth_user_id = auth_session.user_id
    where activity.session_id is null
  ) then
    raise exception using
      message = 'Existem sessões Supabase sem lease da aplicação.',
      detail = 'Publique o frontend da Fase 2, execute os smoke tests e aguarde as sessões ativas registrarem app_session_activity antes de habilitar o enforcement.',
      hint = 'Consulte o checklist de rollout e repita a auditoria de cobertura.';
  end if;

  if exists (
    with authenticated_policies as (
      select
        schemaname,
        tablename,
        permissive,
        coalesce(qual, '') as using_expression,
        coalesce(with_check, '') as check_expression
      from pg_policies
      where 'authenticated'::name = any(roles)
        and schemaname in ('public', 'storage')
    ),
    classified as (
      select
        *,
        (using_expression || ' ' || check_expression) ~*
          '(current_user_status|current_user_role|current_user_permissions|has_current_user_permission|is_current_app_session_active)' as references_session_guard,
        trim(using_expression) = 'false'
          and trim(check_expression) in ('', 'false') as deny_only
      from authenticated_policies
    ),
    table_guards as (
      select distinct schemaname, tablename
      from classified
      where permissive = 'RESTRICTIVE'
        and references_session_guard
    )
    select 1
    from classified policy
    left join table_guards guard
      on guard.schemaname = policy.schemaname
      and guard.tablename = policy.tablename
    where not policy.deny_only
      and not policy.references_session_guard
      and guard.tablename is null
  ) then
    raise exception using
      message = 'Há policies authenticated sem cobertura de sessão validada.',
      detail = 'O enforcement não foi habilitado para evitar proteção parcial.',
      hint = 'Execute supabase/scripts/audit-auth-session-policy-coverage.sql e trate cada linha review_required com uma migration explícita.';
  end if;
end;
$$;

update private.auth_session_policy
set
  enforcement_enabled = true,
  updated_at = now()
where singleton;

commit;

select
  enforcement_enabled,
  idle_timeout,
  absolute_timeout,
  updated_at
from private.auth_session_policy
where singleton;
