# Notifications

## Responsabilidade

A feature `notifications` centraliza a listagem, atualização de status, contador de não lidas e assinatura realtime de notificações do usuário autenticado.

## Estrutura

```text
src/features/notifications/
├── components/
├── constants/
├── context/
├── docs/
├── hooks/
├── model/
├── routes/
├── services/
├── table/
└── index.ts
```

## Decisões

- `constants` concentra copy, labels e chaves de persistência.
- `model` concentra contratos, normalização, parsing, regras de contador, segurança de href interno e detalhes.
- `services` isola Supabase, RPCs e realtime, sempre retornando dados normalizados.
- `context` permanece nesta feature porque `AppProviders` depende de `NotificationsProvider` como provedor global.
- `table` mantém colunas e opções de filtros fora da rota.
- `routes` somente compõe UI, ações e estado visual.

## Validação funcional esperada

- Carregar lista de notificações.
- Marcar uma notificação como lida e não lida.
- Marcar todas como lidas.
- Abrir detalhes.
- Abrir destino apenas quando `href` for rota interna segura.
- Atualizar por realtime quando houver alteração em `notification_deliveries`.
