# src/components

Referência rápida dos componentes impactados nesta entrega.

## Diretórios

| Diretório | Responsabilidade |
| --- | --- |
| `data-table/` | Tabela genérica, filtros, paginação, preferências, loading estável e exportação controlada. |
| `shared/` | Componentes transversais de composição, incluindo `AppPage` para páginas autenticadas. |
| `sidebar/` | Composição da navegação autenticada, perfil, notificações e menu de usuário. |

## Fontes auditadas

- shadcn/ui Sidebar: a sidebar deve ser composição de primitives oficiais e não camada de autorização.
- OWASP Authorization: a sidebar não concede acesso; apenas oculta/mostra itens conforme permissões efetivas vindas do profile.

## DataTable

Durante o carregamento inicial, a toolbar permanece montada e os controles dependentes de dados ficam desabilitados. O skeleton preserva cabeçalhos, largura das colunas, número de linhas e espaço da toolbar para evitar mudança de layout quando os dados chegam.

A exportação é opt-in e oferece três escopos:

- página atual: `table.getRowModel()`, com linhas e colunas visíveis;
- resultados filtrados: `table.getPrePaginationRowModel()` no modo local ou `onExportFilteredRows` no modo manual;
- todo o conteúdo: `table.getCoreRowModel()` no modo local ou `onExportAllRows` no modo manual.

Tabelas com paginação ou filtro server-side não podem inferir registros ausentes no browser; por isso, os escopos remotos só aparecem quando o callback correspondente é fornecido. Tabelas com dados sensíveis usam política explícita por coluna: Clientes não exporta documento, e-mail ou telefone; Unidades não exporta CNPJ, coordenadas ou IP, inclusive no escopo de todo o conteúdo.

Referências: [TanStack Table — Row Models](https://tanstack.com/table/latest/docs/guide/row-models), [TanStack Table — Pagination](https://tanstack.com/table/latest/docs/guide/pagination) e [web.dev — Optimize CLS](https://web.dev/articles/optimize-cls).
