# Modelo de Segurança de Autenticação

## Identidade

- `auth.users` representa o usuário técnico autenticável.
- `app_users` representa o usuário empresarial.
- `technical_email` é opaco e nunca deriva do CPF.
- `cpf_hmac` é o identificador de busca empresarial.

## Autorização

- `owner`, `admin` e `auditor` têm escopo global.
- `manager` e `operator` exigem exatamente uma unidade.
- A UI nunca define autorização sozinha.
- RLS e Edge Functions aplicam as regras server-side.

## Sessões

- Sessões são revalidadas contra `app_users`.
- Reset de senha, reset de passkey e inativação revogam sessões via função SQL interna.
- Rotas protegidas aceitam apenas status `active`.

## Dados Proibidos em Auditoria

- CPF completo.
- Senha.
- Token temporário.
- Challenge ou resposta WebAuthn bruta.
- Access token, refresh token, service role ou secrets.
