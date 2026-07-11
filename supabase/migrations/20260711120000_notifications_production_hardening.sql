alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;

create index if not exists notification_deliveries_recipient_created_id_idx
on public.notification_deliveries(recipient_auth_user_id, created_at desc, id desc);

create index if not exists notification_deliveries_recipient_read_created_id_idx
on public.notification_deliveries(recipient_auth_user_id, read_at, created_at desc, id desc);

create index if not exists notification_deliveries_unread_recipient_created_id_idx
on public.notification_deliveries(recipient_auth_user_id, created_at desc, id desc)
where read_at is null;

comment on table public.notification_events is
  'Eventos de notificação criados pelo backend. Não inserir dados pessoais reais em migrations; usar eventos/auditoria do sistema.';

comment on table public.notification_deliveries is
  'Entregas de notificações por usuário autenticado. read_at nulo indica notificação não lida.';

comment on function public.set_notification_read_status(uuid, boolean) is
  'Marca uma entrega própria como lida ou não lida. Usa auth.uid() para impedir alteração de notificações de outro usuário.';

comment on function public.set_notifications_read_status(uuid[], boolean) is
  'Marca entregas próprias em lote como lidas ou não lidas. Retorna somente ids efetivamente atualizados.';

do $$
begin
  alter publication supabase_realtime add table public.notification_deliveries;
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_all_notifications_read_status(
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
    where delivery.recipient_auth_user_id = auth.uid()
      and (
        (is_read and delivery.read_at is null)
        or (not is_read and delivery.read_at is not null)
      )
    returning delivery.id;
end;
$$;

revoke all on function public.set_all_notifications_read_status(boolean) from public, anon, authenticated;
grant execute on function public.set_all_notifications_read_status(boolean) to authenticated;

comment on function public.set_all_notifications_read_status(boolean) is
  'Marca todas as entregas próprias como lidas ou não lidas. Usa auth.uid() e status ativo para impedir alteração de notificações de outro usuário.';
