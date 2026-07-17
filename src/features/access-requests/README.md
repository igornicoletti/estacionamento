# Access Requests

Feature responsável pela análise administrativa de solicitações pendentes de recuperação de acesso.

## Decisões

- A rota usa `DataTable` apenas como tabela genérica.
- Estados vazios e resultados filtrados usam `AppEmptyState`.
- Detalhes de solicitação usam `AppDetailsSheet`.
- Aprovação de recuperação usa `AppDialog` com senha temporária obrigatória.
- Negativa de recuperação usa `AppAlertDialog`.
- Não há mock local; a leitura vem de `access_recovery_requests`.
- Ações administrativas passam por Edge Functions.
- A autorização real permanece no backend, em Edge Functions, RLS e policies.

## Estrutura

```txt
src/features/access-requests/
├── columns
├── hooks
├── routes
├── services
├── types
├── utils
├── access-requests-copy.ts
├── index.ts
└── README.md
```

## Backend relacionado

```txt
supabase/functions/admin-recovery-review
supabase/migrations/0004_auth_recovery_requests.sql
supabase/migrations/0006_fix_rls_recursion.sql
```

## Contrato

A feature consome:

- `access_recovery_requests` com `status = pending`.

A autorização administrativa exige usuário ativo com role `owner` ou `admin`.
