-- Exercise the operational cron configuration without persisting test jobs or
-- credentials in the local database.
begin;

select private.configure_units_sync_cron(
  'http://host.docker.internal:54321',
  'local-units-contract-test-secret',
  '5 9,15,21 * * *',
  '7 3 * * *'
);

select private.configure_clients_sync_cron(
  'http://host.docker.internal:54321',
  'local-contract-test-secret',
  '5 9,15,21 * * *',
  '7 3 * * *'
);

do $$
begin
  if (select count(*) from cron.job where jobname like 'unit-sync-%') <> 2 then
    raise exception 'expected two unit sync jobs';
  end if;

  if exists (
    select 1
    from cron.job
    where jobname like 'unit-sync-%'
      and command not like '%private.enqueue_units_sync%'
  ) then
    raise exception 'unit cron commands must use the internal enqueue helper';
  end if;

  if exists (
    select 1
    from cron.job
    where jobname like 'unit-sync-%'
      and command like '%local-units-contract-test-secret%'
  ) then
    raise exception 'unit cron command leaked the service secret';
  end if;

  if (select count(*) from cron.job where jobname like 'client-sync-%') <> 3 then
    raise exception 'expected two client jobs and one vehicle resume job';
  end if;

  if not exists (
    select 1
    from cron.job
    where jobname = 'client-sync-incremental-clients'
      and schedule = '5 9,15,21 * * *'
  ) then
    raise exception 'incremental clients schedule was not preserved';
  end if;

  if not exists (
    select 1
    from cron.job
    where jobname = 'client-sync-full-clients'
      and schedule = '7 3 * * *'
  ) then
    raise exception 'full clients schedule was not preserved';
  end if;

  if not exists (
    select 1
    from cron.job
    where jobname = 'client-sync-vehicles-resume'
      and schedule = '*/5 * * * *'
      and command like '%private.enqueue_pending_clients_vehicle_partition%'
  ) then
    raise exception 'vehicle resume job is missing or invalid';
  end if;

  if exists (
    select 1
    from cron.job
    where jobname like 'client-sync-%'
      and command like '%local-contract-test-secret%'
  ) then
    raise exception 'cron command leaked the service secret';
  end if;
end;
$$;

rollback;

select 'sync cron contracts passed' as result;
