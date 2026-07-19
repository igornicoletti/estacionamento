# DataTable

Componente genérico de tabela baseado em TanStack Table e componentes shadcn/ui.

## Decisões

- A tabela é headless no domínio: não conhece detalhes de usuários, permissões ou outras features.
- Cada tabela deve exibir no máximo um campo de busca textual.
- Filtros categóricos usam `DataTableFacetedFilter`, implementado com `Combobox` shadcn/ui em modo `multiple`.
- `searchFields` só é usado quando `globalSearch` não está configurado.
- Estados vazios, erro e filtros sem resultado usam `AppEmptyState`.
- Header da tabela é fixo durante o scroll vertical.
- Scroll horizontal por clique e arraste fica no `DataTableScrollContainer`.
- Controles, paginação e exportação só aparecem quando há dataset carregado.
- Ações de linha devem ser declaradas com `createActionsColumn` e renderizadas por `DataTableRowActions`.
- A paginação usa `Select` shadcn/ui e botões de navegação com labels ocultos para acessibilidade.

## Uso recomendado

- Use `globalSearch` para busca textual única.
- Use `filterFields` para filtros facetados multi-select.
- Use `defaultColumnVisibility` para esconder colunas técnicas usadas apenas por filtros.
- Não coloque detalhes de domínio dentro do `DataTable`; use rota + `AppDetailsSheet`.
- Para ações exibir/editar/excluir, prefira uma coluna única de ações com labels claras e ação destrutiva apenas quando necessário.

## Dependências visuais

- `@/components/ui/table`
- `@/components/ui/combobox`
- `@/components/ui/button`
- `@/components/shared/app-empty-state`
