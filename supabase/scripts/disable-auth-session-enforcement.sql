begin;

update private.auth_session_policy
set
  enforcement_enabled = false,
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
