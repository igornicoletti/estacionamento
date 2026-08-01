# Validação — Unidades

## Revisão aplicada

- Removidos diálogos, hooks, gateway de histórico e runner sem consumidor.
- Preservado `unit-sync-service.ts`, que dispara a Edge Function real e mantém proteção contra execuções concorrentes.
- Removida a feature genérica `src/features/sync`, também sem consumidores.
- Mantidos hooks de filtros e gateways no mesmo padrão já usado pela feature.
- Preservadas consultas Supabase e integração ERP reais; testes usam adapters injetados.

## Checagens esperadas no projeto completo

```bash
pnpm typecheck
pnpm typecheck:test
pnpm lint
pnpm test
pnpm build
```
