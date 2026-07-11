alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;

create index if not exists notification_deliveries_recipient_read_created_idx
on public.notification_deliveries(recipient_auth_user_id, read_at, created_at desc);

create index if not exists notification_deliveries_event_recipient_idx
on public.notification_deliveries(event_id, recipient_auth_user_id);

comment on table public.notification_events is
  'Eventos de notificação criados pelo backend. Clientes autenticados só leem eventos entregues a eles via notification_deliveries.';

comment on table public.notification_deliveries is
  'Entrega por usuário autenticado. read_at nulo indica notificação não lida.';

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
