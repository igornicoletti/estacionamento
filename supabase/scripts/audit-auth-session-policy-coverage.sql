with authenticated_policies as (
  select
    schemaname,
    tablename,
    policyname,
    cmd,
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
select
  policy.schemaname,
  policy.tablename,
  policy.policyname,
  policy.cmd,
  policy.permissive,
  case
    when policy.deny_only then 'deny_only'
    when policy.references_session_guard then 'covered_directly'
    when guard.tablename is not null then 'covered_by_restrictive_policy'
    else 'review_required'
  end as session_coverage,
  policy.using_expression,
  policy.check_expression
from classified policy
left join table_guards guard
  on guard.schemaname = policy.schemaname
  and guard.tablename = policy.tablename
order by
  case
    when policy.deny_only then 3
    when policy.references_session_guard then 2
    when guard.tablename is not null then 1
    else 0
  end,
  policy.schemaname,
  policy.tablename,
  policy.policyname;
