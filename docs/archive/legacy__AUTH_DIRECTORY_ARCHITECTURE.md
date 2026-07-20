# Arquitetura de Auth e Acesso

Data da revisão: 2026-07-13

```txt
src/features/auth/
├── api/
├── components/
├── context/
├── contracts/
├── copy/
├── routes/
├── types/
├── validation/
└── index.ts

src/features/users/
├── columns/
├── hooks/
├── routes/
├── schemas/
├── services/
├── types/
├── utils/
└── index.ts

src/features/access-requests/
├── columns/
├── hooks/
├── routes/
├── services/
├── types/
├── utils/
└── index.ts

src/features/settings/
├── hooks/
├── routes/
├── sections/
├── types/
├── utils/
└── index.ts

supabase/functions/
├── _shared/
├── auth-password/
├── auth-recovery-request/
├── admin-phone-change-review/
├── admin-recovery-review/
├── admin-user-auth-factors/
├── admin-user-block/
├── admin-user-clear-lock/
├── admin-user-create/
├── admin-user-reset-passkey/
├── admin-user-reset-password/
├── admin-user-revoke-sessions/
├── admin-user-update/
└── list-permission-matrix/
```

Barrels exportam APIs públicas de domínio, mas não exportam componentes de rota que são carregados por `React.lazy`. Helpers server-side sensíveis ficam em `supabase/functions/_shared`.

O contrato central de autorização é `src/features/auth/contracts/auth-contracts.ts`. O registro de rotas consome esse contrato em `src/app/router/route-registry.ts`.
