# Clients

Feature responsável por listagem de clientes ativos sincronizados do ERP, veículos por cliente, status VIP e histórico de sincronização.

## Decisões de implementação

- A fonte de dados é real: `erp_clients`, `erp_client_vehicles`, `client_sync_runs` e Edge Function `clients-sync`.
- O módulo só usa mock local quando `VITE_ERP_CATALOG_MOCK_ENABLED=true` em desenvolvimento.
- A tabela usa `DataTable` genérico.
- Detalhes usam `AppDetailsSheet` na rota, não componentes internos da tabela.
- Estados vazios usam `AppEmptyState`.
- O status VIP continua vindo das regras de negócio em `features/rules`.
- Ações de sincronização e VIP ficam disponíveis apenas para owner, admin ou wildcard de permissão.
- O frontend controla UX; autorização real permanece no backend, RLS e Edge Functions.

## Estrutura

```txt
src/features/clients/
├── columns
├── components
├── hooks
├── routes
├── services
├── types
├── utils
├── index.ts
├── clients-copy.ts
└── README.md
```

## Validação recomendada

```bash
npm run typecheck
npm run lint
npm run build
supabase functions deploy clients-sync
```
