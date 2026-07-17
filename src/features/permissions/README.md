# Permissions

Feature responsável por exibir a matriz real de permissões por perfil.

## Estado da auditoria

A implementação foi revisada contra os padrões atuais de `app`, `auth`, `users`, `notifications`, `shared` e `data-table`.

## Decisões de produção

- A feature não mantém dados mockados no frontend.
- A fonte de dados é a Edge Function `list-permission-matrix`.
- A autorização real ocorre no backend, RLS e policies; o frontend apenas renderiza o resultado autorizado.
- A rota usa uma busca global por tabela.
- Grupo e origem são filtros facetados consumidos pelo `DataTable`.
- Estados vazios usam `AppEmptyState`.
- Detalhes usam `AppDetailsSheet`, sem duplicação manual de `<dl>`, `<dt>` e `<dd>` na rota.
- A tabela permanece genérica e não recebe lógica específica da feature.
- O service faz parsing defensivo do payload remoto antes de normalizar a UI.
- A matriz é persistida nas tabelas `permission_groups`, `permissions` e `role_permissions`.

## Estrutura

```txt
src/features/permissions/
├── columns
├── hooks
├── routes
├── services
├── types
├── utils
├── index.ts
├── permissions-copy.ts
└── README.md
```

## Arquivos

- `permissions-copy.ts`: textos da feature.
- `columns/permissions-columns.tsx`: colunas e ações da matriz.
- `hooks/use-permissions.ts`: leitura assíncrona da matriz.
- `routes/permissions-route.tsx`: página, filtros, tabela e sheet de detalhes.
- `services/permissions-service.ts`: gateway Supabase/Edge Function com parsing defensivo.
- `types/permissions-types.ts`: contrato de roles, origem, filtros e linha normalizada.
- `utils/permissions-model.ts`: regras puras de roles, acesso e normalização.
- `utils/permissions-details-model.tsx`: modelo de detalhes para `AppDetailsSheet`.

## Filtros

- Busca global: `label`, `key`, `groupLabel`.
- Filtros facetados: grupo e origem.
- `roles` e `accessFilters` permanecem no modelo normalizado para compor detalhes e ícones da matriz, mas não são expostos como colunas ou filtros da tabela.

## Arquivos obsoletos

Remover do projeto, caso existam:

```txt
src/features/permissions/content/permissions-copy.ts
```

## Validação local recomendada

```bash
npm run typecheck
npm run lint
npm run build
supabase functions deploy list-permission-matrix
```
