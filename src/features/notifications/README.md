# Notifications

Feature responsável por notificações de sistema, segurança e sincronização.

## Decisões de produção

- O estado fica centralizado em `NotificationsProvider`, compartilhado entre popover e página.
- `unreadCount` é consultado no banco com `countUnreadNotifications()`, evitando subcontagem quando a lista carregada estiver limitada.
- O popover exibe somente notificações não lidas e limita a altura para não estourar o viewport.
- O badge do botão de notificações usa o mesmo `unreadCount` do contexto.
- Ao clicar em uma notificação não lida no popover, o status muda para lida de forma otimista e o usuário navega para o destino interno ou para `/notificacoes`.
- `markAllAsRead` usa RPC própria para marcar todas as entregas não lidas do usuário, não apenas os 100 registros carregados.
- `markAllAsRead` e `updateStatus` fazem atualização otimista, controlam pending por notificação e refazem a leitura para convergência com o banco.
- O popover consome o mesmo contexto da página e não cria assinatura Realtime independente.
- A página usa `AppDetailsSheet`; o layout de detalhes não deve ser duplicado em rotas.
- A tabela usa `DataTable` com uma busca global e filtros facetados reutilizáveis.
- O service usa RLS e RPCs para marcação como lida/não lida; o cliente não atualiza tabela diretamente.

## Banco de dados

Requisitos:

- `notification_events` e `notification_deliveries` com RLS habilitado.
- Políticas de leitura restritas ao usuário autenticado e ativo.
- RPCs `set_notification_read_status`, `set_notifications_read_status` e `set_all_notifications_read_status` com `security definer` e validação por `auth.uid()`.
- `notification_deliveries` publicada em `supabase_realtime` para sincronização do header e página.
- Migrations novas não devem inserir dados pessoais reais ou identificadores fixos de usuário.

## Arquivos

- `context/notifications-provider.tsx`: estado único, realtime e ações otimistas.
- `services/notifications-service.ts`: gateway Supabase/memória/teste com parsing defensivo.
- `routes/notifications-route.tsx`: página de notificações.
- `columns/notifications-columns.tsx`: colunas e ações da tabela.
- `utils/notifications-rules.ts`: regras puras de contador, ordenação, unread e href interno.
- `utils/notifications-details-model.tsx`: itens de detalhes para `AppDetailsSheet`.
