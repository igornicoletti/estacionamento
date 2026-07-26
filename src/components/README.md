# src/components

Referência rápida dos componentes impactados nesta entrega.

## Diretórios

| Diretório | Responsabilidade |
|---|---|
| `shared/` | Componentes transversais de composição, incluindo `AppPage` para páginas autenticadas. |
| `sidebar/` | Composição da navegação autenticada, perfil, notificações e menu de usuário. |

## Fontes auditadas

- shadcn/ui Sidebar: a sidebar deve ser composição de primitives oficiais e não camada de autorização.
- OWASP Authorization: a sidebar não concede acesso; apenas oculta/mostra itens conforme permissões efetivas vindas do profile.
