# Validação — Unidades

## Revisão aplicada

- Removida dependência de `@/features/sync`.
- Adicionados `UnitSyncBlockingDialog` e `executeUnitSyncWithRefresh` locais.
- `UnitsSyncHistoryDialog` passou a ser autocontido e usa componentes compartilhados do projeto.
- Mantidos hooks de filtros e gateways no mesmo padrão já usado pela feature.
- Preservado suporte a mock e Supabase para troca futura por ERP real.

## Checagens esperadas no projeto completo

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
