create or replace function public.set_all_notifications_read_status(
  is_read boolean
)
returns table(id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.app_users app_user
    where app_user.auth_user_id = (select auth.uid())
      and app_user.status = 'active'
  ) then
    return;
  end if;

  return query
    update public.notification_deliveries delivery
    set read_at = case when is_read then now() else null end
    where delivery.recipient_auth_user_id = (select auth.uid())
      and (
        (is_read and delivery.read_at is null)
        or (not is_read and delivery.read_at is not null)
      )
    returning delivery.id;
end;
$$;

revoke all on function public.set_all_notifications_read_status(boolean)
from public, anon, authenticated;
grant execute on function public.set_all_notifications_read_status(boolean)
to authenticated;

comment on function public.set_all_notifications_read_status(boolean) is
  'Marca todas as entregas próprias como lidas ou não lidas. Usa auth.uid() e status ativo para impedir alteração de notificações de outro usuário.';
