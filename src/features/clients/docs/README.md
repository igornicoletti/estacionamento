# Clientes

## Objetivo

Feature responsável por consulta operacional de clientes ativos, veículos vinculados, marcação VIP comercial e sincronização manual com o ERP.

## Estrutura

```text
src/features/clients/
├── components/
├── constants/
├── docs/
├── hooks/
├── model/
├── routes/
├── services/
├── table/
└── index.ts
```

## Padrão alinhado a `src/features/units`

- `constants/clients-copy.ts` concentra textos de interface e erros.
- `constants/clients-persistence.ts` concentra chaves de cache, visibilidade de colunas, limites e valores padrão persistidos.
- `constants/clients-routes.ts` concentra rotas da feature.
- `hooks/use-clients-table-filters.ts` e `hooks/use-client-vehicles-table-filters.ts` montam filtros derivados da tabela, no mesmo padrão de `useUnitsTableFilters`.
- `routes` compõe tela, permissões, eventos e componentes reutilizáveis sem montar filtros inline.
- `services/clients-gateway.ts` segue o gateway de `units`: validação com `zod`, suporte a `erp-mock`, Supabase browser client e erro explícito quando o serviço não está configurado.
- `components/clients-sync-history-dialog.tsx` é apenas wrapper de domínio sobre `SyncHistoryDialog`, como `UnitsSyncHistoryDialog`.
- A raiz mantém apenas `index.ts`.

## Correções aplicadas

- Separada a resolução de cliente da consulta de veículos, evitando snapshot amplo de todos os veículos para abrir `/clientes/:cod_pessoa`.
- Adicionada consulta dedicada `listClientVehiclesByClientId`.
- Removidos filtros montados diretamente nas rotas.
- Removido gateway mock local duplicado; a feature usa o mock central de ERP, como `units`.
- Adicionadas `DEFAULT_CLIENTS_COLUMN_VISIBILITY` e `DEFAULT_CLIENT_VEHICLES_COLUMN_VISIBILITY`.
- Removido toast de carregamento por promessa para VIP; feedback de loading não usa toast.
- Preservadas policies de RLS por permissão em migration dedicada.
