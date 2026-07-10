# src

Referência rápida da camada frontend.

## Diretórios desta entrega

| Diretório | Responsabilidade |
|---|---|
| `app/` | Bootstrap, providers, layout autenticado e roteamento declarativo. |
| `components/sidebar/` | Sidebar autenticada derivada do registry de rotas e permissões efetivas. |
| `features/auth/` | Autenticação, sessão, validação, copy e rotas públicas de auth. |

## Fontes auditadas

- React Router: router criado fora da árvore React e rotas lazy com definição leve.
- shadcn/ui: composição oficial de Sidebar, Dialog, AlertDialog, Select, Textarea e Spinner.
- Supabase RLS + OWASP Authorization: frontend filtra UX; autorização real fica em banco/RLS e RPC de perfil efetivo.
