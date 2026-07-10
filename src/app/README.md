# src/app

Camada de inicialização da aplicação. Mantém providers globais, roteamento e layout autenticado. Não deve conter regra de domínio específica de feature.

## Arquivos e diretórios

| Caminho | Responsabilidade |
|---|---|
| `app-providers.tsx` | Monta providers globais: tooltip, autenticação e toasts. |
| `app-copy.ts` | Centraliza textos de app, grupos de rota e fallbacks para evitar literais espalhados. |
| `layouts/authenticated-layout.tsx` | Layout da área autenticada com Sidebar shadcn/ui, header, conteúdo e alerta de inatividade. |
| `router/` | Registry e composição das rotas React Router. |

## Decisões

- O layout autenticado usa `SidebarProvider` e `SidebarInset` conforme a composição oficial do shadcn/ui Sidebar.
- O alerta de inatividade é renderizado no layout com `AppAlertDialog`, mas o estado fica no `AuthProvider`.
- O router consome tokens de rota centralizados; não há paths duplicados no header/sidebar/menu.
