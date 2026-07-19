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
- `layouts/` mantém apenas layout autenticado e diálogo de inatividade integrado ao contexto de autenticação.
- `router/` separa registro declarativo, lazy loaders, route gates e error boundary.
- `route-lazy-loaders.ts` usa imports diretos dos arquivos de rota para não depender de barrels incompletos das features.
- `route-registry.ts` é a fonte única de URLs, permissões, agrupamento da sidebar e modo de scroll por rota.
- Rotas com `scrollMode: "content"` rodam com scroll interno no painel autenticado; rotas de formulário/visão geral usam o fluxo normal do documento.
- `route-elements.tsx` concentra estados de carregamento, acesso negado, not found e o gate de autenticação/proteção.
- A raiz de `src/app` contém somente `index.ts`.

## Contratos externos esperados

- `@/features/auth` deve exportar `AuthProvider`, `useAuth`, `authCopy`, `AUTH_PERMISSION`, `AuthPermission` e `canAccessProtectedApp`.
- `@/features/notifications` deve exportar `NotificationsProvider`.
- As features roteadas devem manter os arquivos de rota declarados em `router/route-lazy-loaders.ts`.
- A sidebar deriva grupos, ícones, labels e permissões diretamente do registry; a navegação não deve duplicar paths ou permissões manualmente.
