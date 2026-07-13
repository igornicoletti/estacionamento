# Validation Report

Data da revisão: 2026-07-13

## Comandos

```bash
pnpm validate
pnpm lint
pnpm typecheck
pnpm typecheck:test
pnpm test
pnpm build
```

Para Supabase Functions:

```bash
deno check supabase/functions/<function-name>/index.ts
```

## O Que O Validador Confirma

- Arquivos críticos de auth, notificações, rotas, Supabase Functions, migration comercial e CI existem.
- `tsconfig.app.json` não inclui testes.
- `tsconfig.test.json` cobre a suíte de testes.
- `NotificationsProvider` está registrado em `AppProviders`.
- Permissões `prices.manage` e `rules.manage` existem no contrato e na migration.
- Perfil autenticado trata permissões explicitamente inválidas como negação.
- `auth-password`, `auth-recovery-request` e `admin-user-auth-factors` estão configuradas em `supabase/config.toml`.
- Signup está desabilitado, senha forte está ativa e sessões têm inatividade/timebox configurados.
- Salvamento comercial usa `create_commercial_price_table` e `save_vip_rule_version`.
- Funções Supabase usam `_shared/index.ts` e `_shared/auth-cors.ts`.
- O cache de `useAsyncSnapshot` pode ser limpo e não aplica resposta obsoleta.
- O serviço de usuários não usa gateway em memória fora de testes.
- A suíte possui cobertura para rotas, serviços, permissões, notificações, unidades, clientes, preços, regras e auth contracts.

## Testes Automatizados

- Auth: validação de CPF/senha/recuperação e normalização estrita de permissões.
- DataTable: renderização, busca, estado vazio filtrado e ações de linha.
- Router: error boundary, acesso negado e fallbacks.
- Notificações: provider, popover, rota e serviço.
- Permissões: matriz de perfis/permissões e rota.
- Preços: serviço RPC e rota.
- Regras VIP: escopo, labels, persistência e versionamento via serviço.
- Unidades e clientes: rotas, detalhes e serviços.

## CI

O workflow `.github/workflows/ci.yml` executa instalação com `pnpm --frozen-lockfile`, validação estrutural, lint, typechecks, Vitest, build e `deno check` das Edge Functions.
