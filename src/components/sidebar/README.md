# sidebar

Sidebar e header da área autenticada.

## Arquivos

- `sidebar-app.tsx`: composição principal de `Sidebar`, header, content, footer e rail.
- `sidebar-brand.tsx`: marca/logos com comportamento collapse/expanded.
- `sidebar-config.ts`: deriva navegação do `route-registry` e associa ícones.
- `sidebar-copy.ts`: textos da sidebar, menus e dialogs.
- `sidebar-header.tsx`: header superior com trigger mobile, notificações, usuário e botão de sair desktop.
- `sidebar-nav-group.tsx`: grupo colapsável de navegação.
- `sidebar-navigation.tsx`: filtra grupos por permissões efetivas.
- `sidebar-notifications-popover.tsx`: popover de notificações com `AppEmptyState`.
- `sidebar-profile.tsx`: indicador estático do perfil/role atual.
- `sidebar-user-menu.tsx`: menu do usuário e logout mobile/dropdown.
- `index.ts`: superfície pública do diretório.

## Decisões

- Paths, labels e permissões vêm do `route-registry`; não há paths hardcoded na sidebar.
- Sidebar usa componentes oficiais shadcn/ui: `SidebarMenu`, `SidebarMenuButton`, `SidebarGroup`, `SidebarRail`.
- O texto visual do toggle lateral é oculto com `sr-only`; o `aria-label` mantém acessibilidade.
- Botão de sair destrutivo fica no header desktop e oculto no mobile.
- Notificações usam `AppEmptyState`, não `Empty` direto.
- O indicador de perfil é informativo e não executa ação; controles interativos reais ficam no menu do usuário e no header.

## Referências auditadas

- shadcn/ui Sidebar.
- shadcn/ui Dropdown Menu.
- shadcn/ui Popover.
- shadcn/ui Empty via componente compartilhado do projeto.
