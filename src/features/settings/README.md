# Settings

Feature responsável por exibir o perfil, o status de sessão, a situação de passkey e as permissões efetivas da conta autenticada.

## Decisões de produção

- A tela usa `useAuth` como fonte única de sessão e perfil.
- A feature não mantém mock local nem estado persistido próprio.
- A tela é somente leitura até existir contrato backend explícito para alteração de telefone, senha, avatar ou passkey.
- Estados de carregamento, erro e perfil ausente são tratados na rota.
- Estados vazios usam `AppEmptyState`.
- Ações não implementadas foram removidas para evitar falsa sensação de persistência.
- A autorização real permanece em RLS, RPCs e Edge Functions; o frontend apenas renderiza dados autorizados.

## Estrutura

```txt
src/features/settings/
├── README.md
├── index.ts
├── settings-copy.ts
├── hooks/
│   └── use-settings.ts
├── routes/
│   └── settings-route.tsx
├── sections/
│   ├── settings-profile-section.tsx
│   └── settings-security-section.tsx
├── types/
│   └── settings-types.ts
└── utils/
    └── settings-models.ts
```

## Arquivos removidos do desenho anterior

- `sections/settings-preferences-password-dialog.tsx`
- `sections/settings-preferences-profile-form.tsx`
- `sections/settings-preferences-section.tsx`

Esses arquivos dependiam de contratos de autenticação inexistentes no módulo `auth` atual ou simulavam alterações sem persistência real.
