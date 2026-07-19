# Feature audit

## Objetivo

A feature `audit` apresenta a trilha de auditoria real da tabela `public.audit_events`, mantendo o front-end responsável por carregamento, normalização defensiva, filtragem local e apresentação. A autorização permanece no Supabase por Row Level Security.

## Estrutura

```text
src/features/audit
├── constants
│   ├── audit-copy.ts
│   ├── audit-labels.ts
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

- A raiz da feature mantém somente `index.ts`.
- `constants` centraliza copy, labels de interface, valores de domínio exibidos no front-end e chaves de persistência.
- `services` isola Supabase e falha explicitamente quando o client não está configurado, evitando tela vazia silenciosa.
- `model` contém tipos, normalização defensiva, sanitização, filtros e montagem dos detalhes exibidos.
- `hooks` separa carregamento assíncrono e estado de tabela.
- `table` concentra colunas e filtros da `DataTable`.
- `routes` apenas compõe página, header, tabela e sheet de detalhes.

## Validação de produção esperada no projeto

Após aplicar o diretório no repositório real, execute:

```bash
pnpm typecheck
pnpm exec eslint . --max-warnings=0
pnpm test
pnpm build
```
