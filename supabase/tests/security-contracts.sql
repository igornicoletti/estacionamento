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

select 'security contracts passed' as result;
