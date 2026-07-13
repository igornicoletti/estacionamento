# Estado Atual do Projeto

Data da revisão: 2026-07-13

## Resumo

O projeto está organizado como aplicação Vite + React 19 + TypeScript 6 com módulos de domínio em `src/features`, componentes compartilhados em `src/components`, funções Supabase em `supabase/functions` e migrations em `supabase/migrations`.

A revisão de 2026-07-13 aplicou as correções auditadas de autenticação, autorização, Supabase, preços, regras comerciais, notificações, testes, CI e documentação.

## Features

| Feature | Diretório | Persistência principal | Rotas |
| --- | --- | --- | --- |
| Auth | `src/features/auth` | Supabase Auth + Edge Functions | `/login`, `/recuperar-acesso` |
| Unidades | `src/features/units` | Gateway de serviço | `/unidades`, `/unidades/:cod_empresa/usuarios` |
| Clientes | `src/features/clients` | Gateway de serviço | `/clientes`, `/clientes/:cod_pessoa` |
| Preços | `src/features/prices` | Supabase RPC + tabelas comerciais | `/precos` |
| Regras | `src/features/rules` | Supabase RPC + tabelas comerciais | `/regras` |
| Usuários | `src/features/users` | Supabase Edge Functions | `/usuarios` |
| Solicitações | `src/features/access-requests` | Supabase Edge Functions | `/solicitacoes-acesso` |
| Permissões | `src/features/permissions` | Supabase RPC | `/perfis-permissoes` |
| Auditoria | `src/features/audit` | Serviço de auditoria | `/auditoria` |
| Notificações | `src/features/notifications` | Provider + gateway | `/notificacoes` |
| Configurações | `src/features/settings` | Perfil autenticado | `/configuracoes`, `/perfil` |

## Autorização

Permissões atuais em `src/features/auth/contracts/auth-contracts.ts`:

- `profile.read_self`
- `settings.read_self`
- `notifications.read`
- `units.read`
- `clients.read`
- `client_vehicles.read`
- `prices.read`
- `prices.manage`
- `rules.read`
- `rules.manage`
- `users.read`
- `users.manage`
- `access_requests.read`
- `access_requests.review`
- `permissions.read`
- `audit.read`
- `*`

Permissões vindas do perfil autenticado são estritas. O fallback por papel só é usado quando a lista de permissões não veio do backend; uma lista explícita inválida não concede acesso por inferência.

## Supabase

Configuração endurecida em `supabase/config.toml`:

- signup público desabilitado;
- senha mínima 12 com `lower_upper_letters_digits_symbols`;
- `secure_password_change = true`;
- sessão com `inactivity_timeout = "15m"` e `timebox = "24h"`;
- `auth-password` e `auth-recovery-request` públicas;
- `admin-user-auth-factors` com JWT obrigatório.

Funções adicionadas ou revisadas:

- `supabase/functions/_shared/index.ts`
- `supabase/functions/_shared/auth-cors.ts`
- `supabase/functions/auth-password/index.ts`
- `supabase/functions/auth-recovery-request/index.ts`
- `supabase/functions/admin-user-auth-factors/index.ts`

Migration comercial/autorização:

- `supabase/migrations/20260713170614_unify_permission_authorization.sql`

Ela unifica permissões por `role_permissions`, adiciona `prices.manage` e `rules.manage`, cria helper `private.has_current_user_permission`, impede sobreposição de preços ativos e expõe RPCs transacionais/auditadas para preços e regras VIP.

## Validação

Comandos obrigatórios antes de entrega:

```bash
pnpm validate
pnpm lint
pnpm typecheck
pnpm typecheck:test
pnpm test
pnpm build
deno check supabase/functions/<function-name>/index.ts
```

O workflow `.github/workflows/ci.yml` executa essa suíte em CI, incluindo `deno check` para todas as funções Supabase.
