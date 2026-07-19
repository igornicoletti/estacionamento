# src/features/sync

`src/features/sync` não representa uma página. Ele é um módulo compartilhado para UI e modelos de histórico usados por sincronizações ERP → aplicação.

## Arquivos

- `components/sync-blocking-dialog.tsx`: diálogo bloqueante enquanto a sincronização manual está em execução. Usa `AppEmptyState` com `Spinner` no `media` e impede fechamento por escape/interação externa.
- `components/sync-history-dialog.tsx`: lista lateral de histórico usando `AppSheet`, `AppEmptyState`, `Badge`, `Button`, `Collapsible` e `Skeleton`.
- `constants/sync-copy.ts`: textos comuns de status, modo, origem, erros e fallback.
- `model/sync-history-schemas.ts`: schemas e tipos de sincronização.
- `model/sync-history-formatters.ts`: formatação de datas, duração, labels de modo/origem/status.
- `model/sync-history-errors.ts`: normalização segura de mensagens e detalhes de falhas.
- `utils/sync-history-errors.ts`: compatibilidade para imports existentes em `units` e `clients`.

## Pontos preservados

- Não há `routes/`.
- Não há `table/`.
- Não há service genérico de sincronização.
- A sincronização manual continua em `units` e `clients`.
- O histórico continua sendo carregado pelos services dos próprios domínios.
