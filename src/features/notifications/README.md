# Notifications

Feature responsável por notificações de sistema, segurança e sincronização.

## Decisões de produção

- O estado de notificações fica em `NotificationsProvider`, compartilhado entre header popover e página.
- `unreadCount` é derivado de `data`, eliminando divergência entre contador e lista.
- `markAllAsRead` e `updateStatus` fazem atualização otimista e refetch para convergência com o banco.
- O popover consome o mesmo contexto da página e não cria assinatura Realtime independente.
- A página usa `AppSheet` diretamente para detalhes; `data-table` permanece genérico.
- O serviço usa RLS e RPCs para marcação como lida/não lida; o cliente não atualiza tabela diretamente.

## Banco de dados

Requisitos:

- `notification_events` e `notification_deliveries` com RLS habilitado.
- Políticas de leitura restritas ao usuário autenticado e ativo.
- RPCs `set_notification_read_status` e `set_notifications_read_status` com `security definer` e validação por `auth.uid()`.
- `notification_deliveries` publicada em `supabase_realtime` para sincronização do header e página.

## Arquivos

- `context/notifications-provider.tsx`: estado único da feature.
- `services/notifications-service.ts`: gateway Supabase/memória/teste.
- `routes/notifications-route.tsx`: página de notificações.
- `columns/notifications-columns.tsx`: colunas sem acoplamento a sheet/details.
- `utils/notifications-rules.ts`: regras puras de contador, unread e href interno.
