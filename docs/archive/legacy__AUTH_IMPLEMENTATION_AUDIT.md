# Auditoria de Implementação de Autenticação

Esta implementação introduz autenticação baseada em CPF, sessão técnica Supabase Auth, passkey/WebAuthn, senha fallback, recuperação de acesso e trilha de auditoria.

## Decisões de Segurança

- CPF é entrada do fluxo, não identidade pública.
- CPF completo não deve ser persistido no frontend, URL, JWT, metadata pública, logs ou auditoria.
- O backend calcula `cpf_hmac` com secret server-side.
- Usuários nascem em `pending` e só acessam módulos internos em `active`.
- `inactive`, `password_reset` e `passkey_reset` bloqueiam rotas internas.
- Operações administrativas são Edge Functions com service role, permissão, motivo e auditoria.
- RLS fica habilitado em todas as tabelas expostas.
- `user_metadata` não é usado para autorização.

## Referências

- Supabase Passkeys: https://supabase.com/docs/guides/auth/passkeys
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Securing API: https://supabase.com/docs/guides/api/securing-your-api
- shadcn Field: https://ui.shadcn.com/docs/components/field
- shadcn React Hook Form: https://ui.shadcn.com/docs/forms/react-hook-form
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
