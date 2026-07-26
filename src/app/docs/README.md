# src/app

Camada de aplicação responsável por providers globais, layout autenticado, registro de rotas, lazy loaders, fallbacks e cópia institucional da navegação.

## Estrutura

```text
src/app/
├── constants/
├── docs/
├── layouts/
├── providers/
├── router/
└── index.ts
```

## Decisões aplicadas

- `constants/` centraliza textos e metadados estáveis da aplicação.
- `providers/` mantém composição global explícita e sem estado próprio.
- `providers/authenticated-app-providers.tsx` monta notificações e unidade selecionada apenas dentro do shell autenticado.
- `layouts/` mantém shell autenticado, conteúdo visual e diálogo de inatividade integrado ao contexto de autenticação.
- `router/` separa registry, lazy loaders, builders, gates, estados de rota e error reporting.
- `router/components/` concentra UI de loading, acesso negado, not found, gates e boundary.
- `route-lazy-loaders.ts` usa imports diretos dos arquivos de rota para não depender de barrels incompletos das features.
- `route-registry.ts` é a fonte única de URLs, permissões e agrupamento da sidebar.
- O layout autenticado usa o scroll natural do documento; rotas não declaram modo de scroll nem recebem contêiner de overflow próprio.
- `routes.tsx` apenas compõe a árvore; `route-builders.tsx` cria objetos de rota.
- `route-access.ts` centraliza decisões compartilháveis de acesso; gates continuam renderizados porque a sessão vem de contexto React.
- `route-error-reporter.ts` concentra logging de boundary e `RouterProvider.onError`.
- A raiz de `src/app` contém somente `index.ts` como barrel público enxuto.
- O conteúdo renderizado pelo `Outlet` deve usar `AppPage` para título, subtítulo, ações e área principal; o layout não injeta padding ou scroll nesse ponto.

## Contratos externos esperados

- `@/features/auth` deve exportar `AuthProvider`, `useAuth`, `authCopy`, `AUTH_PERMISSION`, `AuthPermission` e `canAccessProtectedApp`.
- `@/features/notifications` deve exportar `NotificationsProvider`.
- As features roteadas devem manter os arquivos de rota declarados em `router/route-lazy-loaders.ts`.
- A sidebar deriva grupos, ícones, labels e permissões diretamente do registry; a navegação não deve duplicar paths ou permissões manualmente.
- `SidebarInset` é o único landmark `main` do shell autenticado; a região de conteúdo usa `div`.
