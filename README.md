# Generic shadcn Data Table

Aplicação Vite + React + TypeScript para validar uma `DataTable` genérica e reutilizável baseada em TanStack Table, shadcn/ui, Tailwind CSS, React Router, Sonner, Zod e Supabase.

O objetivo deste diretório é manter a tabela como um bloco independente do domínio. Os dados seguem mockados enquanto a estrutura geral do produto evolui para sidebar, header, formulários e integrações reais.

## Stack

- Vite 8
- React 19
- TypeScript 6
- React Router 8
- Tailwind CSS 4 com `@tailwindcss/vite`
- shadcn/ui v4
- TanStack Table v8
- Supabase Auth, Edge Functions e RLS
- React Hook Form
- Sonner
- Zod 4
- Vitest + Testing Library
- ESLint 10

## Rotas

- `/login`
- `/recuperar-acesso`
- `/unidades`
- `/clientes`
- `/clientes/:id` exibe os veículos vinculados ao cliente selecionado
- `/usuarios`
- `/perfil`
- `/auditoria`
- `/` redireciona para `/unidades`
- `*` renderiza a página 404 com busca dinâmica baseada nas rotas cadastradas

As rotas internas são protegidas por sessão Supabase e perfil empresarial `active`. A rota direta de veículos foi removida; veículos são acessados pelo contexto do cliente. A estrutura usa `React.lazy`, `Suspense`, `ProtectedRoute` e metadados centralizados em `src/app/router/route-definitions.ts`.

## Arquitetura

```txt
shadcn-data-table-generic/
├── docs/
├── supabase/
│   ├── migrations/
│   └── functions/
├── scripts/
├── tests/
│   ├── auth/
│   ├── setup.ts
│   ├── components/
│   │   ├── data-table/
│   │   └── toast/
│   └── mocks/
├── src/
│   ├── app/
│   │   ├── layouts/
│   │   └── router/
│   ├── config/
│   ├── components/
│   │   ├── data-table/
│   │   ├── sidebar/
│   │   ├── toast/
│   │   └── ui/
│   ├── assets/
│   │   └── brand/
│   ├── features/
│   │   ├── auth/
│   │   ├── audit/
│   │   ├── profile/
│   │   ├── users/
│   │   └── data-table/
│   │       ├── columns/
│   │       ├── components/
│   │       ├── routes/
│   │       │   ├── clients/
│   │       │   ├── units/
│   │       │   └── users/
│   │       ├── table-details.ts
│   │       └── table-config.ts
│   ├── mocks/
│   │   └── table-data/
│   ├── lib/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
└── componentes e configs do projeto
```

## Responsabilidades

- `src/components/data-table/`: engine genérica da tabela. Não importa mocks, rotas ou colunas de domínio.
- `src/components/sidebar/`: shell lateral e header do produto, composto sobre componentes shadcn/ui.
- `src/components/toast/`: API central de notificações com sanitização e tradução antes de exibir mensagens.
- `src/components/ui/`: componentes shadcn/ui do projeto.
- `src/app/router/route-definitions.ts`: fonte única dos metadados de rotas.
- `src/features/auth/`: fluxo progressivo CPF, passkey, senha fallback e recuperação de acesso.
- `src/features/users/`: cadastro administrativo e regras de perfil/unidade.
- `src/features/profile/`: senha fallback, telefone, passkeys e sessões do usuário.
- `src/features/audit/`: logs de login e logs do sistema.
- `src/features/data-table/`: implementação do domínio atual de tabelas, incluindo rotas, colunas, configuração e mapeamento de detalhes.
- `supabase/migrations/`: schema, RLS, auditoria, rate limit e recuperação.
- `supabase/functions/`: Edge Functions públicas e administrativas.
- `tests/`: testes fora de `src`, separados por contexto.
- `docs/`: relatórios de validação e auditoria.

## Comandos

```bash
pnpm dev
pnpm validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Decisões

- Imports shadcn usam `@/components/ui/*`.
- Alias `@` aponta para `src` também no `tsconfig.json` raiz, para o shadcn CLI resolver `src/components/ui`.
- A aplicação usa modo claro por padrão.
- O azul da marca é `oklch(0.7188 0.1679 216.84)`.
- Cada tabela possui um único campo de busca via `globalSearch`.
- As tabelas atuais não exibem coluna de seleção por checkbox.
- O rodapé da tabela exibe `Exibindo X de X item/itens`.
- Veículos são um recurso contextual de Clientes e não possuem rota direta de navegação.
- Login usa CPF como entrada, mas CPF completo não é persistido no frontend, URL, JWT ou auditoria.
- RP ID de produção para passkeys: `estacionamento.redemontecarlo.com.br`.
- Usuários internos só acessam rotas protegidas com status empresarial `active`.
- Dados mockados permanecem até a estrutura de shell, formulários e integração real ser definida.
