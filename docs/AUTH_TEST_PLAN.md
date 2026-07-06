# Plano de Testes de Auth

## Unitários

- CPF válido/inválido.
- Senha forte.
- Confirmação de senha.
- Email condicional.
- Telefone obrigatório.
- Regras de perfil global e unidade.

## Integração Supabase

- Migrations aplicam schema, RLS e grants.
- Edge Functions validam Zod no backend.
- Criação de usuário cria `auth.users` e `app_users`.
- Falha em `app_users` compensa removendo `auth.users`.
- Status não ativo bloqueia rotas internas.

## E2E

- Primeiro acesso com senha temporária e passkey.
- Login por passkey.
- Fallback por senha.
- Recuperação de acesso.
- Reset de senha.
- Reset de passkey.
- Auditoria com tabs de login e sistema.
- Auditoria com coluna de ações e Sheet de informações por texto principal e menu.
- Meu perfil com avatar, dados disabled, dialogs de nome/email, senha e MFA.

## Negativos

- CPF completo não aparece em storage, URL, JWT, logs ou auditoria.
- Múltiplos submits são bloqueados.
- Request não é enviada quando o frontend está inválido.
- Mensagens públicas não enumeram usuários.
- Campos de senha e MFA não ficam expostos diretamente na página de perfil.
- Tabelas de listagem não usam markup manual nem Sheet duplicado.
