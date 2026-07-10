# src/features/auth

Feature de autenticação e sessão. Este diretório centraliza estado de sessão, contratos de auth, validação, copy e rotas públicas. Não deve recriar wrappers simples de input, botão ou guard.

## Arquivos e diretórios

| Caminho | Responsabilidade |
|---|---|
| `auth-api.ts` | Fronteira de comunicação com Supabase Auth, Edge Functions e RPC de perfil. |
| `auth-contracts.ts` | Tokens técnicos de status, next actions, storage, inatividade e permissões. |
| `auth-copy.ts` | Textos de autenticação, validação e feedback. |
| `auth-provider.tsx` | Estado central de sessão, profile, permissões, inatividade, logout e troca obrigatória de senha. |
| `auth-validation.ts` | Validação única dos fluxos de auth com Zod. |
| `components/auth-page-card.tsx` | Composição visual das páginas públicas de auth. |
| `routes/` | Telas públicas de login e recuperação. Formulários ficam explícitos na tela. |
| `types/` | Tipos públicos legados/compatíveis, apontando para os contratos atuais. |

## Fontes auditadas

- Supabase RLS: frontend não decide autorização real; `permissions` filtram UX, enquanto RLS/policies protegem dados.
- OWASP Authorization Cheat Sheet: menor privilégio, negar por padrão e validação em cada requisição.
- shadcn/ui Dialog: usado para troca obrigatória de senha porque é formulário modal.
- shadcn/ui AlertDialog: usado para inatividade/logout porque exige decisão explícita do usuário.
- shadcn/ui Spinner: loading é usado diretamente em botões, sem wrapper de submit.


## Decisões de segurança desta etapa

- `auth-validation.ts` espelha os contratos reais das Edge Functions em `supabase/functions/_shared/auth-validation.ts`: CPF, senha, nova senha e recuperação.
- `auth-provider.tsx` mantém o timer de inatividade dentro do estado central de sessão; não existe componente `AuthInactivityGuard`.
- Quando o backend retorna `register_passkey`, o cliente mantém fail-closed e mostra `AppAlertDialog`, pois não há implementação WebAuthn/passkey validada por documentação oficial Supabase neste projeto.
- A autorização por UI usa `permissions` vindas de `public.get_current_auth_profile()`, criada pela migração Supabase desta entrega.
