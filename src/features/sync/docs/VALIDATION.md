# Validação específica de sync

A feature foi validada como módulo compartilhado, não como página.

## Contratos públicos mantidos

- `SyncBlockingDialog`
- `SyncHistoryDialog`
- `syncCopy`
- `SyncCounters`
- `SyncHistoryCounter`
- `SyncHistoryEntry`
- `SyncRunMode`
- `SyncRunStatus`
- `SyncRunTrigger`
- `normalizeSyncErrorDetails`
- `normalizeSyncHistoryMessage`

## Compatibilidade

Mantido `utils/sync-history-errors.ts` para não quebrar imports atuais de `units` e `clients` enquanto esses domínios usam services próprios para histórico.
