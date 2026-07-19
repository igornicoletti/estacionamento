# src/features/users

Feature responsável por listagem, cadastro, edição e ações administrativas de usuários.

## Estrutura

- `components`: diálogo de formulário e sheet de detalhes.
- `constants`: textos e chaves persistentes.
- `hooks`: orquestra carregamento e mutações.
- `model`: tipos, labels, validação e helpers puros.
- `routes`: composição da página.
- `services`: integração Supabase, Edge Functions e gateway de teste.
- `table`: colunas e filtros da DataTable.

## Contratos preservados

- `UsersRoute`
- `useUsers`
- `createUsersColumns`
- `listUsers`
- `createUser`
- `updateUser`
- `blockUser`
- `resetUserAccess`
- `resetUserPasskey`
- `clearUserLock`
- `revokeUserSessions`
- `UserRecord`, `CreateUserInput`, `UpdateUserInput`
- `userRoleLabels`, `appUserStatusLabels`
- `resolveLastAccessLabel`, `resolvePasskeyLabel`
