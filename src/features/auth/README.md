# auth

Diretório de autenticação organizado por responsabilidade.

## Estrutura

- `api/`: comunicação Supabase/Auth Functions e mapeamento seguro de payloads.
- `contracts/`: tokens, status, permissões, chaves de storage e regras derivadas.
- `copy/`: textos reutilizados por rotas e dialogs.
- `context/`: provider/hook de sessão, perfil, inatividade e ações de auth.
- `validation/`: schemas Zod, máscaras e normalização.
- `components/`: composição visual específica de auth.
- `routes/`: páginas públicas de login e recuperação.
- `types/`: superfície de compatibilidade tipada.

## Auditoria

- React Router: rotas públicas carregadas via lazy route modules.
- shadcn/ui Dialog e AlertDialog: troca de senha em dialog; sessão/passkey em alert dialog.
- Supabase: frontend não é fronteira de autorização; permissões efetivas devem vir do backend/RLS.
- OWASP: deny-by-default, fail-closed em passkey sem WebAuthn validado e menor privilégio.
