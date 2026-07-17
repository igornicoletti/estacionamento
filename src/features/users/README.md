# Users

## Escopo

Diretório responsável pela gestão administrativa de usuários da aplicação.

Este módulo cobre listagem, criação, edição, detalhes, bloqueio, reset de acesso, reset de passkey, remoção de bloqueio temporário e revogação de sessões.

## Arquitetura

```txt
src/features/users
├── columns
├── hooks
├── routes
├── schemas
├── services
├── types
├── utils
├── index.ts
├── users-copy.ts
└── README.md
```

## Contrato público

A API pública do módulo deve sair por `index.ts`.

Consumidores externos devem importar a partir de:

```ts
import { UsersRoute, useUsers } from "@/features/users"
```

Evite imports diretos de subpastas fora da própria feature, exceto quando houver necessidade explícita e controlada.

## Decisões de implementação

- `DataTable` permanece genérico.
- Detalhes de usuário são responsabilidade da rota via `AppDetailsSheet`.
- Confirmações destrutivas usam `AppAlertDialog`.
- Formulários usam `AppDialog`.
- Campo de senha usa `AppPasswordField`.
- Validação de formulário usa Zod 4.
- Validação de segurança é repetida no service e no backend.
- Ações administrativas remotas usam Edge Functions com contrato `{ ok: boolean }`.
- A interface não cria usuário sintético quando o backend não retorna persistência confirmada.

## Segurança

O front controla visibilidade e UX. A autorização real deve acontecer nas Edge Functions e no banco.

Regras aplicadas no pacote:

- usuário não executa ação administrativa contra si mesmo;
- admin não altera owner;
- admin não promove usuário para owner;
- roles globais não recebem unidade;
- roles operacionais exigem unidade;
- CPF é validado e persistido por HMAC no backend;
- ações administrativas geram auditoria;
- RLS e policies são aplicadas para leitura controlada.

## Backend relacionado

Este módulo depende das funções:

```txt
admin-user-create
admin-user-update
admin-user-block
admin-user-clear-lock
admin-user-revoke-sessions
admin-user-reset-password
admin-user-reset-passkey
```

Também depende das migrations de hardening incluídas no pacote full-stack.

## Validação local recomendada

```bash
npm run typecheck
npm run lint
npm run build
supabase db push
supabase functions deploy admin-user-create
supabase functions deploy admin-user-update
supabase functions deploy admin-user-block
supabase functions deploy admin-user-clear-lock
supabase functions deploy admin-user-revoke-sessions
supabase functions deploy admin-user-reset-password
supabase functions deploy admin-user-reset-passkey
```
