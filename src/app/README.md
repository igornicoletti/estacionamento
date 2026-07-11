# app

Camada de bootstrap, providers globais, layout autenticado e roteamento da aplicação.

## Arquivos

- `app-copy.ts`: textos globais de rotas, fallback e loading.
- `app-providers.tsx`: providers globais, `TooltipProvider`, `AuthProvider` e `ToastApp`.
- `layouts/authenticated-layout.tsx`: layout autenticado com sidebar, header, outlet e alerta de inatividade.
- `router/app-router.tsx`: cria e fornece o data router.
- `router/routes.tsx`: transforma registry em árvore de rotas.
- `router/route-registry.ts`: fonte única de ids, paths, labels, permissões e lazy loaders.
- `router/route-elements.tsx`: route gates e fallbacks reutilizáveis.
- `router/route-error-boundary.tsx`: error boundary de rota.

## Decisões

- O router é criado fora da árvore React conforme React Router.
- Rotas mantêm definição leve no registry e carregam implementação por `lazy`.
- Guards são adaptadores burros; lógica de sessão/permissões fica no auth context.
- Não usar `app-shell.tsx`; o layout válido é `authenticated-layout.tsx`.

## Referências auditadas

- React Router `createBrowserRouter`.
- React Router `route.lazy`.
- React Router Error Boundaries.
- shadcn/ui Sidebar para composição `SidebarProvider`, `Sidebar`, `SidebarInset`.
