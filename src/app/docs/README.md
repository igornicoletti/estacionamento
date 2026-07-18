# src/app

Camada de composição da aplicação: providers globais, layout autenticado, metadados de rotas e criação do router.

## Estrutura

- `app-copy/`: textos globais usados por rotas, fallbacks e estados de carregamento.
- `app-providers/`: composição dos providers globais da SPA.
- `layouts/`: layout autenticado com Sidebar shadcn/ui, header e `Outlet`.
- `router/`: criação do data router, gates, fallbacks, lazy loaders, registry e árvore de rotas.
- `index.ts`: barrel público do módulo `app`.

## Decisões arquiteturais

- A raiz mantém somente `index.ts` para reduzir acoplamento estrutural e evitar imports diretos de arquivos soltos.
- `app-copy` e `app-providers` viraram diretórios com `index`, preservando compatibilidade com `@/app/app-copy` e `@/app/app-providers`.
- `route-registry` mantém metadados estáveis de rota; `route-lazy-loaders` concentra carregamento dinâmico.
- Gates de rota não duplicam regra de autenticação; consomem o estado consolidado de `features/auth`.
- Fallbacks usam `AppEmptyState` e `Spinner`, mantendo consistência visual com os componentes compartilhados.

## Referências

- React: composição por componentes.
- React Router: `createBrowserRouter`, `RouterProvider`, `lazy`, `errorElement` e `hydrateFallbackElement`.
- shadcn/ui Sidebar: `SidebarProvider`, `Sidebar`, `SidebarInset` e composição do layout.
- TypeScript: `strict`, aliases e fronteiras tipadas de módulo.
