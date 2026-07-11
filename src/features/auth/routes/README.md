# `src/features/auth/routes`

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `auth-login-route.tsx` | Tela pública de login. Mantém campos simples no próprio formulário e usa `AppDialog` para troca obrigatória de senha. |
| `auth-recovery-route.tsx` | Tela pública de recuperação. Mantém campos simples no próprio formulário e chama a fronteira `auth-api` via `AuthProvider`/serviço. |

## Referências auditadas

- shadcn/ui Dialog: usado na troca obrigatória de senha, porque é fluxo modal de formulário.
  - https://ui.shadcn.com/docs/components/dialog
- shadcn/ui Spinner: loading direto dentro de `Button`, sem wrapper `SubmitButton`.
  - https://ui.shadcn.com/docs/components/spinner
- shadcn/ui Input Group: usado apenas em `AppPasswordField`, não para CPF ou campos comuns.
  - https://ui.shadcn.com/docs/components/input-group
