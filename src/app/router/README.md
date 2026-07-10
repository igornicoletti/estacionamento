# src/app/router

Referência rápida do roteamento. Este diretório mantém o router declarativo, sem regras de negócio duplicadas. Autenticação, sessão, permissões e inatividade ficam no `AuthProvider`.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `app-router.tsx` | Cria o `createBrowserRouter(routes)` fora da árvore React e renderiza `RouterProvider`. |
| `route-registry.ts` | Fonte única de IDs, paths, segmentos, permissões exigidas, labels, descrições e lazy loaders de rota. Também alimenta a sidebar. |
| `routes.tsx` | Transforma o registry em `RouteObject[]`, aplicando gates burros de sessão/permissão. Não contém labels, textos ou regras de role. |
| `route-elements.tsx` | Elementos burros de rota: loading, gate público, gate privado, home autenticada, 403 e 404. |
| `route-error-boundary.tsx` | Boundary único de erro de rota baseado em `useRouteError`/`isRouteErrorResponse`. |

## Fontes auditadas

- React Router `createBrowserRouter`: router criado fora da árvore React, evitando recriação por renderização.
- React Router `lazy`: registry mantém definição leve e usa lazy loaders para módulos de rota.
- React Router Error Boundary: errors de rota devem ser tratados por boundary para evitar tela quebrada.
- OWASP Authorization Cheat Sheet: o gate de rota é UX/defesa adicional; a segurança real deve negar por padrão no backend/RLS.
