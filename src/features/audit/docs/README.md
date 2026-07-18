# Feature audit

## Objetivo

A feature `audit` apresenta a trilha de auditoria real da tabela `public.audit_events`, mantendo o front-end responsável apenas por carregamento, normalização defensiva, filtragem local e apresentação. A autorização permanece no Supabase por Row Level Security.

## Estrutura

```text
src/features/audit
├── constants
│   ├── audit-copy.ts
│   ├── audit-persistence.ts
│   └── index.ts
├── docs
│   ├── README.md
│   └── VALIDATION.md
├── hooks
│   ├── index.ts
│   ├── use-audit.ts
│   └── use-audit-table-state.ts
├── model
│   ├── audit-event-labels.ts
│   ├── audit-filtering.ts
│   ├── audit-metadata.ts
│   ├── audit-normalization.ts
│   ├── audit-outcome.ts
│   ├── audit-types.ts
│   └── index.ts
├── routes
│   ├── audit-route.tsx
│   └── index.ts
├── services
│   ├── audit-service.ts
│   └── index.ts
├── table
│   ├── audit-columns.tsx
│   ├── audit-filter-options.ts
│   └── index.ts
└── index.ts
```

## Decisões aplicadas

- A raiz contém somente `index.ts`, mantendo o consumo externo concentrado no barrel público da feature.
- `constants` centraliza copy e chaves de persistência.
- `services` isola acesso ao Supabase e aplica limite controlado de leitura.
- `model` concentra contratos, labels, normalização, filtros, montagem de detalhes e regras de resultado/severidade.
- `hooks` separa carregamento assíncrono (`useAudit`) da orquestração de estado da tabela (`useAuditTableState`).
- `table` concentra colunas e opções de filtros da `DataTable`.
- `routes` compõe a página sem carregar regra de domínio, normalização ou montagem de colunas diretamente.

## Referências técnicas utilizadas

- React: componentes puros, composição e extração de lógica reutilizável em custom hooks.
- TanStack Table: estabilidade de referências para `columns`, `data` e estado controlado.
- TypeScript: `strict`, `noUnusedLocals`, `noUnusedParameters` e fronteiras com `unknown` em payload externo.
- ESLint: remoção de variáveis, imports e responsabilidades não utilizadas.
- Supabase: leitura por `select`, ordenação, limite e defesa em profundidade por RLS no banco.

## Aplicação no projeto

Substitua integralmente o diretório atual:

```bash
rm -rf src/features/audit
cp -R audit-refatorado/src/features/audit src/features/audit
npm run typecheck
npm run lint
npm run build
```

No Windows PowerShell:

```powershell
Remove-Item -Recurse -Force src\features\audit
Copy-Item -Recurse audit-refatorado\src\features\audit src\features\audit
npm run typecheck
npm run lint
npm run build
```
