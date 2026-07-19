# src/features/permissions

Feature responsável por exibir a matriz efetiva de permissões por perfil.

## Estrutura

- `constants`: textos, labels, chaves de persistência e metadados de apresentação.
- `components`: componentes locais pequenos que não devem ir para `shared`.
- `hooks`: composição de carregamento e filtros da tela.
- `model`: contratos, type guards, normalizadores, parsers e modelo de detalhes.
- `routes`: composição da página.
- `services`: fronteira Supabase e fallback direto por tabelas.
- `table`: definição de colunas.

## Decisões

- A raiz da feature mantém somente `index.ts`.
- A rota não contém regras de parsing nem montagem de matriz.
- O service tenta a RPC `list-permission-matrix` e, se ela falhar, faz fallback direto para `app_permissions` e `app_role_permissions`.
- Dados desconhecidos entram como `unknown` e são normalizados antes de chegar à UI.
- Não há schema Zod local porque esta feature não possui formulário nem payload de escrita pelo frontend.
