# Validação da feature permissions

Comandos executados no pacote isolado:

```bash
npx tsc -p validation/tsconfig.json
unzip -t /mnt/data/estacionamento-feature-permissions-refatorado.zip
```

Verificações estruturais:

- Raiz de `src/features/permissions` contém somente `index.ts`.
- Código de produção sem `any`.
- Código de produção sem `console.*`, `debugger`, `TODO`, `FIXME` ou `HACK`.
- `MANIFEST.json` validado contra os arquivos reais do pacote.

Validação no projeto:

```bash
pnpm test -- tests/features/permissions/permissions-service.test.ts tests/features/permissions/permissions-route.test.tsx tests/features/permissions/permissions-matrix-model.test.ts
pnpm typecheck
pnpm lint
pnpm build
```

Checklist forense:

- A UI não consulta `app_permissions`/`app_role_permissions` diretamente.
- A Edge Function `list-permission-matrix` exige JWT de usuário.
- O helper compartilhado valida sessão ativa por RPC `is_auth_session_active`.
- Tabelas legadas `permissions`/`role_permissions` não participam da autorização.
