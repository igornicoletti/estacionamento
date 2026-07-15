# Units

Feature responsável por listagem de unidades sincronizadas do ERP, usuários vinculados por unidade, configuração de pátio e histórico de sincronização.

## Decisões de implementação

- A fonte de dados é real: `erp_units`, `unit_yard_configs`, `unit_sync_runs` e Edge Function `units-sync`.
- O módulo só usa mock local quando `VITE_ERP_CATALOG_MOCK_ENABLED=true` em desenvolvimento.
- A tabela usa `DataTable` genérico.
- Detalhes usam `AppDetailsSheet` na rota, não componentes internos da tabela.
- Estados vazios usam `AppEmptyState`.
- A configuração de pátio usa `AppDialog`.
- Ações de sincronização ficam disponíveis apenas para owner, admin ou wildcard de permissão.
- O frontend controla UX; autorização real permanece no backend, RLS e Edge Functions.

## Estrutura

```txt
src/features/units/
├── columns
├── components
├── hooks
├── routes
├── services
├── types
├── utils
├── index.ts
├── units-copy.ts
└── README.md
```

## Validação recomendada

```bash
npm run typecheck
npm run lint
npm run build
supabase functions deploy units-sync
```
