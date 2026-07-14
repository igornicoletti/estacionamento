# Settings

Feature responsável por exibir e atualizar dados seguros do perfil autenticado, incluindo avatar, nome, e-mail, situação de passkey e permissões efetivas da conta.

## Decisões de produção

- A tela usa `useAuth` como fonte única de sessão e perfil.
- A feature não mantém mock local nem estado persistido próprio.
- Alterações de nome, e-mail e avatar usam a Edge Function `profile-update`.
- Uploads de avatar usam o bucket privado `avatars`, com políticas por pasta do usuário autenticado.
- Cadastro de passkey usa o fluxo beta do Supabase Auth, iniciado apenas por ação explícita do usuário autenticado.
- Campos administrativos ou sensíveis continuam somente leitura e são exibidos em inputs desabilitados.
- Estados de carregamento, erro e perfil ausente são tratados na rota.
- Estados vazios usam `AppEmptyState`.
- A autorização real permanece em RLS, RPCs e Edge Functions; o frontend apenas renderiza dados autorizados.

## Estrutura

```txt
src/features/settings/
├── components/
│   └── profile-photo-dialog.tsx
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
├── services/
│   └── settings-profile-service.ts
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
