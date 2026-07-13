# Estacionamento

Aplicação Vite + React + TypeScript para operação administrativa do estacionamento, com `DataTable` genérica baseada em TanStack Table, shadcn/ui, Tailwind CSS, React Router, Sonner, Zod e Supabase.

O projeto separa o core visual reutilizável (`src/components`) dos módulos de domínio (`src/features`). Em produção, autenticação, autorização, preços, regras comerciais e auditoria dependem de Supabase Auth, Edge Functions, RLS e RPCs transacionais.

## Stack

- Vite 8
- React 19
- TypeScript 6
- React Router 8
- Tailwind CSS 4 com `@tailwindcss/vite`
- shadcn/ui v4
- TanStack Table v8
- Supabase Auth, Edge Functions, Postgres, RLS e RPC
- React Hook Form
- Sonner
- Zod 4
- Vitest + Testing Library
- ESLint 10

## Rotas

- `/login`
- `/recuperar-acesso`
- `/`
- `/unidades`
- `/unidades/:cod_empresa/usuarios`
- `/clientes`
- `/clientes/:cod_pessoa`
- `/precos`
- `/regras`
- `/usuarios`
- `/solicitacoes-acesso`
- `/perfis-permissoes`
- `/auditoria`
- `/notificacoes`
- `/configuracoes`
- `/perfil`
- `*`

As rotas públicas e protegidas são descritas em `src/app/router/route-registry.ts` e renderizadas por `src/app/router/route-elements.tsx`. Rotas internas exigem sessão Supabase, perfil empresarial `active` e permissões explícitas do contrato `src/features/auth/contracts/auth-contracts.ts`.

## Arquitetura

```txt
estacionamento/
├── .github/workflows/
├── docs/
├── scripts/
├── src/
│   ├── app/
│   │   ├── layouts/
│   │   └── router/
│   ├── components/
│   │   ├── data-table/
│   │   ├── shared/
│   │   ├── sidebar/
│   │   ├── toast/
│   │   └── ui/
│   ├── config/
│   ├── features/
│   │   ├── access-requests/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── notifications/
│   │   ├── permissions/
│   │   ├── prices/
│   │   ├── rules/
│   │   ├── settings/
│   │   ├── units/
│   │   └── users/
│   ├── hooks/
│   ├── lib/
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── functions/
│   └── migrations/
└── tests/
```

## Responsabilidades

- `src/components/data-table/`: engine genérica de tabela; não importa mocks, rotas nem features.
- `src/components/sidebar/`: shell lateral, navegação, perfil e popover de notificações.
- `src/components/toast/`: API central de feedback com sanitização antes de exibir mensagens.
- `src/app/router/`: metadados de rota, lazy loading, guards, fallbacks e error boundary.
- `src/features/auth/`: sessão, autenticação por CPF/senha, recuperação, permissões e inatividade.
- `src/features/prices/`: tabelas comerciais versionadas via RPC `create_commercial_price_table`.
- `src/features/rules/`: regras VIP versionadas via RPC `save_vip_rule_version`.
- `src/features/users/`: administração de usuários, bloqueio, fatores e sessões via Edge Functions.
- `supabase/functions/`: funções públicas de auth e funções administrativas com JWT.
- `supabase/migrations/`: schema, RLS, permissões, RPCs, auditoria e restrições comerciais.
- `tests/`: testes unitários e de rota fora de `src`.
- `scripts/validate-package.mjs`: validador estrutural contra regressões auditadas.

## Ambiente

Copie as variáveis necessárias a partir de `.env.example`.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ORIGIN`
- `APP_HMAC_SECRET`
- `APP_ALLOWED_ORIGINS`

Em produção, `VITE_APP_ORIGIN` e `VITE_SUPABASE_URL` devem usar HTTPS. O client valida a origem em runtime para evitar execução em domínio não autorizado.

## Supabase

Configuração local principal em `supabase/config.toml`:

- signup público desabilitado;
- senha mínima de 12 caracteres com letras maiúsculas, minúsculas, números e símbolos;
- troca de senha com reautenticação;
- sessão limitada por inatividade de 15 minutos e timebox de 24 horas;
- funções `auth-password` e `auth-recovery-request` públicas com CORS/HMAC;
- função `admin-user-auth-factors` protegida por JWT;
- permissões comerciais `prices.manage` e `rules.manage` aplicadas em RLS e RPCs.

Antes de usar o ambiente remoto, aplique as migrations e publique as Edge Functions correspondentes ao mesmo commit.

## Comandos

```bash
pnpm dev
pnpm validate
pnpm lint
pnpm typecheck
pnpm typecheck:test
pnpm test
pnpm build
```

Para checar funções Supabase localmente:

```bash
deno check supabase/functions/<function-name>/index.ts
```

## CI

`.github/workflows/ci.yml` executa instalação congelada, validação estrutural, lint, typecheck da aplicação, typecheck dos testes, Vitest, build e `deno check` das Edge Functions.

## Decisões

- Imports shadcn usam `@/components/ui/*`.
- Alias `@` aponta para `src`.
- A aplicação usa modo claro por padrão.
- O azul da marca é `oklch(0.7188 0.1679 216.84)`.
- Veículos são recurso contextual de Clientes e não têm rota de navegação direta.
- CPF completo não deve ser persistido em frontend, URL, JWT ou auditoria.
- Barrels não exportam componentes de rota carregados por `React.lazy`.
- Escritas comerciais críticas são transacionais no banco, versionadas e auditadas.
