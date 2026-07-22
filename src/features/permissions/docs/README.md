# src/features/permissions

Feature responsável por exibir a matriz efetiva de permissões por perfil.

## Estrutura

- `constants`: textos, labels, chaves de persistência e metadados de apresentação.
- `components`: componentes locais pequenos que não devem ir para `shared`.
- `hooks`: composição de carregamento e filtros da tela.
- `model`: contratos, type guards, normalizadores, parsers e modelo de detalhes.
- `routes`: composição da página.
- `services`: fronteira Supabase única via Edge Function protegida.
- `table`: definição de colunas.

## Decisões

- A raiz da feature mantém somente `index.ts`.
- A rota não contém regras de parsing nem montagem de matriz.
- O service só lê a matriz via `list-permission-matrix` quando existe JWT de sessão validado; sem sessão validada, retorna erro de sessão em linguagem de usuário.
- A montagem efetiva da matriz fica no backend para evitar duplicação entre UI, RLS e Edge Function.
- `list-permission-matrix` permanece com `verify_jwt = true`; a sessão revogada é checada por RPC `is_auth_session_active`, executada com `service_role`, sem consultar `auth.sessions` via REST.
- Dados desconhecidos entram como `unknown` e são normalizados antes de chegar à UI.
- Não há schema Zod local porque esta feature não possui formulário nem payload de escrita pelo frontend.
