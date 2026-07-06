# Validation Report

## Comandos

```bash
pnpm validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## O Que O Validador Confirma

- A aplicação usa Vite, React, TypeScript, Tailwind CSS 4, shadcn/ui, Zod, React Router e TanStack Table.
- O shadcn resolve `@/components/ui` para `src/components/ui`.
- `docs/` contém relatórios e `tests/` contém os testes automatizados.
- Não existem imports antigos de registry nem diretórios legados de exemplos.
- Existe uma única exportação pública de `DataTable`.
- O core `src/components/data-table/` não importa mocks nem features.
- Tabelas de domínio reutilizam `DataTable`; markup manual de tabela fora do core é bloqueado.
- Clientes, veículos do cliente, unidades, usuários e auditoria usam o padrão central de tabela.
- Auditoria usa `createActionsColumn`, `createDataTableDetailsAction` e `DataTableDetailsTextTrigger`.
- Todas as tabelas com linha de ações mantêm o item `Informações` abrindo o Sheet centralizado.
- Rotas usam `React.lazy`, `Suspense`, `ProtectedRoute` e metadados centralizados.
- A página 404 lê opções de navegação de `appRouteDefinitions`.
- Veículos não existem como rota direta; são acessados por `/clientes/:id`.
- As rotas de tabela não usam `searchFields`, `toolbarActions`, botão adicionar ou seleção de linha.
- Busca global cobre múltiplas colunas relevantes e preserva espaços durante a digitação.
- Filtros e células de opções não exibem ícones.
- MFA usa apenas `active/inactive`, exibidos como `Ativo/Inativo`.
- O menu de colunas não exibe o rótulo extra.
- O rodapé da tabela exibe `Exibindo X de X item/itens`.
- Toasts passam pela API central com sanitização e tradução.
- `Meu perfil` mantém dados atuais em inputs disabled e expõe senha/MFA apenas por `Dialog`.
- Upload de avatar em `Meu perfil` usa `Empty` e serviço centralizado.
- O tema usa o azul da marca e sombras suaves.
- Datasets mockados são não vazios e mantêm referências consistentes.
- Hooks de snapshot assíncrono compartilham a mesma base (`useAsyncSnapshot`) para reduzir duplicação entre features.
- O domínio de usuários usa gateway injetável para facilitar transição de mock para persistência real.
- O favicon foi alinhado para servir `svg` com fallback `ico`, evitando inconsistência de tipo de asset.

## Testes Automatizados

- Utilitários de filtro: normalização, busca sem acento/case e dedupe.
- `DataTable`: renderização de linhas, busca, estado filtrado vazio e recuperação com clear filters.
- Auditoria: detalhes abrem pelo texto principal e pelo menu de ações.
- Perfil: dados atuais disabled, upload por `Empty` e formulários sensíveis somente em dialogs.
- Toast: sanitização, fallback e tradução de mensagens.
- Mock data: loaders aplicam sanitização de telefone/CEP e MFA fica em `Ativo/Inativo`.
- Hooks compartilhados: `useAsyncSnapshot` cobre carregamento inicial, `refetch`, fallback de erro e cancelamento por unmount.
- Sidebar: popover de notificações possui cobertura de abertura e ações primárias.
- Usuários: diálogo de cadastro possui cobertura de validações obrigatórias no submit.
