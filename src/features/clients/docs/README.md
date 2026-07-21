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
- `components/clients-sync-history-dialog.tsx` é autocontido e não depende de `src/features/sync`, mantendo a sincronização de clientes restrita à própria feature.
- A raiz mantém apenas `index.ts`.

## Correções aplicadas

- Separada a resolução de cliente da consulta de veículos, evitando snapshot amplo de todos os veículos para abrir `/clientes/:cod_pessoa`.
- Adicionada consulta dedicada `listClientVehiclesByClientId`.
- Removidos filtros montados diretamente nas rotas.
- Removido gateway mock local duplicado; a feature usa o mock central de ERP, como `units`.
- Adicionadas `DEFAULT_CLIENTS_COLUMN_VISIBILITY` e `DEFAULT_CLIENT_VEHICLES_COLUMN_VISIBILITY`.
- Removido toast de carregamento por promessa para VIP; feedback de loading não usa toast.
- Preservadas policies de RLS por permissão em migration dedicada.


## Revisão crítica pós-erro 400 em commercial_rules

A página de clientes não carrega mais o hook genérico de regras comerciais para resolver VIP. A leitura de VIP usa uma consulta mínima e estável em `commercial_rules`, restrita a `type`, `target_type`, `client_id`, `vehicle_id`, `vehicle_ids`, `status`, `ends_at` e `updated_at`, evitando que colunas comerciais novas ou ausentes derrubem a tela operacional de clientes.

A rota de veículos também passou a carregar o cliente por `cod_pessoa`, sem buscar toda a lista de clientes apenas para resolver título e subtítulo.
