# Permissions

Feature responsável por exibir a matriz real de permissões por perfil.

## Decisões

- A rota usa apenas um campo de busca global por tabela.
- Grupo, origem, perfil e acesso são filtros facetados com Combobox shadcn/ui.
- Detalhes ficam na rota com `AppSheet`.
- Estados vazios usam `AppEmptyState`.
- A tabela permanece genérica e sem componentes de detalhes internos.
- A fonte de dados é a Edge Function `list-permission-matrix`.
- A matriz é persistida nas tabelas `permission_groups`, `permissions` e `role_permissions`.

## Estrutura

```txt
src/features/permissions/
├── columns
├── content
├── hooks
├── routes
├── services
├── types
├── utils
├── index.ts
└── README.md
```

## Filtros

- Busca global: `label`, `key`, `groupLabel`.
- Faceted filters: grupo, origem, perfil e acesso.
- `roles` e `accessFilters` são colunas técnicas escondidas por padrão e usadas apenas para filtragem.

## Contrato

A feature consome `PermissionMatrixRow[]` normalizado para a UI.

A autorização real ocorre no backend. O front apenas renderiza o resultado autorizado.
