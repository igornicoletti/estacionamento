# DataTable

Componente genérico de tabela baseado em TanStack Table e componentes shadcn/ui.

## Decisões

- A tabela é headless no domínio: não conhece detalhes de usuários, permissões ou outras features.
- Cada tabela deve exibir no máximo um campo de busca textual.
- Filtros categóricos usam `DataTableFacetedFilter`, implementado com `Combobox` shadcn/ui em modo `multiple`.
- Filtros categóricos podem receber `groups`; o layout do campo não muda e a lista usa `ComboboxGroup`, `ComboboxLabel` e `ComboboxCollection`.
- `searchFields` só é usado quando `globalSearch` não está configurado.
- Estados vazios, erro e filtros sem resultado usam `AppEmptyState`.
- Header da tabela é fixo durante o scroll vertical.
- Scroll horizontal por clique e arraste fica no `DataTableScrollContainer`.
- O bloco de controles só aparece quando a tabela tem busca, filtros, ações, visibilidade de coluna ou exportação.
- A paginação é independente do bloco de controles e continua disponível quando habilitada.
- Exportação é centralizada em `DataTableExportMenu`, com opções para página atual, dados filtrados e dados carregados.
- Use `surface="plain"` quando a tabela já estiver dentro de um `Card`; use o padrão `surface="card"` para listagens de página.
- Ações de linha devem ser declaradas com `createActionsColumn` e renderizadas por `DataTableRowActions`.
- A paginação usa `Select` shadcn/ui e botões de navegação com labels ocultos para acessibilidade.

## Uso recomendado

- Use `globalSearch` para busca textual única.
- Use `filterFields` para filtros facetados multi-select.
- Use `filterFields.groups` apenas quando o agrupamento representar dado real da tabela, como cidades agrupadas por UF.
- Use `defaultColumnVisibility` para esconder colunas técnicas usadas apenas por filtros.
- Não coloque detalhes de domínio dentro do `DataTable`; use rota + `AppDetailsSheet`.
- Para ações exibir/editar/excluir, prefira uma coluna única de ações com labels claras e ação destrutiva apenas quando necessário.
- Evite `surface="card"` dentro de outro `Card`; isso recria bordas duplicadas e reduz a legibilidade da listagem.

## Dependências visuais

- `@/components/ui/table`
- `@/components/ui/combobox`
- `@/components/ui/button`
- `@/components/shared/app-empty-state`
