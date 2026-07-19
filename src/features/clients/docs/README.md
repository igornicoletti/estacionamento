# Clientes

## Objetivo

Feature responsável por consulta operacional de clientes, veículos vinculados, marcação VIP comercial e sincronização manual com o ERP.

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

## Decisões aplicadas

- `constants` centraliza copy, chaves de cache, chaves de persistência e limites operacionais.
- `model` centraliza contratos, parsing, sanitização, formatação, mapeamento de linhas e detalhes.
- `services` concentra integração com Supabase, paginação segura e chamadas de Edge Function.
- `hooks` expõe estado assíncrono por tela, sem regra de UI.
- `table` contém colunas e opções de filtros.
- `routes` apenas compõe tela, permissões, eventos e componentes reutilizáveis.
- A raiz mantém apenas `index.ts`.

## Correções relevantes

- Removido acesso genérico à tabela `clients`; a feature usa os contratos reais `erp_clients`, `erp_client_vehicles`, `client_sync_runs` e Edge Function `clients-sync`.
- Removido fallback silencioso quando o Supabase client não existe; as falhas agora são explícitas.
- Removido import fora do topo em service.
- Preservadas as rotas `ClientsRoute` e `ClientVehiclesRoute`.
- Preservado fluxo de histórico e bloqueio durante sincronização.
