# Arquitetura de Diretórios de Auth

```txt
src/features/auth/
├── components/
├── hooks/
├── routes/
├── schemas/
├── services/
├── types/
└── index.ts

src/features/users/
├── components/
├── schemas/
├── services/
├── types/
└── index.ts

src/features/profile/
├── components/
│   ├── profile-action-row.tsx
│   ├── profile-avatar-upload.tsx
│   ├── profile-identity-form.tsx
│   ├── profile-mfa-change-form.tsx
│   ├── profile-passkey-list.tsx
│   ├── profile-password-form.tsx
│   ├── profile-session-list.tsx
│   └── index.ts
├── routes/
├── schemas/
├── services/
└── index.ts

src/features/audit/
├── components/
├── columns/
├── routes/
├── services/
├── types/
├── audit-copy.ts
├── audit-details.ts
├── table-config.ts
└── index.ts

supabase/
├── migrations/
└── functions/
    ├── _shared/
    ├── auth-start/
    ├── auth-password/
    ├── auth-complete-passkey/
    ├── auth-register-passkey/
    ├── auth-recovery-request/
    └── admin-*/
```

Barrels exportam apenas a API pública de cada contexto. Helpers server-side sensíveis ficam dentro de `supabase/functions/_shared`.
