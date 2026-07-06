# Final Audit

## Parecer

O projeto está organizado como uma aplicação Vite funcional com React, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Table, Sonner, Zod, React Router e Supabase preparado para autenticação. A `DataTable` permanece como engine genérica e reutilizável, separada das features, rotas, modelos e dados mockados.

## Decisões Implementadas

- Rotas principais usam `React.lazy`, `Suspense`, `ProtectedRoute` e metadados centralizados.
- `/clientes`, `/clientes/:id`, `/usuarios`, `/unidades`, `/auditoria` e `/perfil` seguem a estrutura atual.
- Veículos não possuem rota direta; a tabela de veículos é contextual ao cliente em `/clientes/:id`.
- Página 404 usa `appRouteDefinitions`, sem duplicar paths.
- Sidebar/header ficam no shell autenticado; 404 pública não fica dentro do layout autenticado.
- Cada tabela de domínio reutiliza `DataTable`; markup manual de tabela fora do core é bloqueado no validador.
- Auditoria usa as mesmas ações e o mesmo Sheet de detalhes das tabelas de unidades, clientes, usuários e veículos.
- Filtros e células de opções exibem texto sem ícones.
- MFA foi normalizado para `Ativo/Inativo`.
- Colunas foram reorganizadas para priorizar dados críticos.
- Colunas de checkbox e botões de adicionar permanecem fora das tabelas atuais.
- O rodapé exibe `Exibindo X de X item/itens`.
- Cabeçalhos ordenáveis alternam entre padrão, ascendente e descendente por clique.
- Sonner permanece centralizado em `src/components/toast`, com sanitização e tradução.
- `Meu perfil` usa uma única seção com borda, `Separator`, `Empty` para avatar, `Alert` informativo e `Dialog` para ações sensíveis.
- Senha e MFA não ficam expostos diretamente na página de perfil.
- `tsconfig`, aliases e `components.json` estão alinhados com VS Code e shadcn CLI.
- Hooks de leitura assíncrona passaram a usar base compartilhada para reduzir duplicação e facilitar testes de `refetch`/erro/cancelamento.
- `src/lib` foi consolidado com helpers de normalização e redução de superfície pública não utilizada.
- `users` mantém contrato consolidado entre schema, service e UI com gateway preparado para fase de persistência real.
- Assets de favicon foram alinhados com `svg` primário e fallback `ico`.

## Validação

Executar:

```bash
pnpm validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Contratos Antirregressão

- Não criar tabelas manuais para páginas que são listagens.
- Não duplicar Sheet de detalhes fora de `src/components/data-table/data-table-details.tsx`.
- Não adicionar ícones em filtros de opção ou células de opção.
- Não reintroduzir MFA `required`, `not_required` ou `enabled`.
- Não expor campos de senha/MFA diretamente em `Meu perfil`.
- Não alterar componentes existentes em `src/components/ui/**`; adicionar novos componentes UI somente quando solicitado.
