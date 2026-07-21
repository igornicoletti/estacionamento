# Remediacao Forense - 2026-07-13

## Escopo aplicado

- Fluxo de autenticacao revisado ponta a ponta: login por senha, primeiro acesso, reset de senha, cadastro de passkey, login por passkey, reset de passkey, revisao de telefone e revisao de recuperacao.
- Primeiro acesso/reset de senha agora encaminha para `passkey_reset` e so libera `active` apos cadastro WebAuthn validado em `auth-register-passkey`.
- Login por passkey usa `supabase.auth.signInWithPasskey()` e registra auditoria em `auth-passkey-login`.
- Reset administrativo de passkey remove credenciais em `auth.webauthn_credentials`, limpa fatores WebAuthn legados, revoga sessoes e exige recadastro.
- Troca de senha por perfil valida a senha atual, atualiza senha via Admin API, audita e revoga sessoes globais.
- Funcoes remotas antigas de passkey/perfil/revisoes administrativas foram versionadas localmente e republicadas com `_shared`, CORS por `APP_ALLOWED_ORIGINS` e auditoria com fingerprint HMAC.
- `admin-user-auth-factors` passou a contar passkeys em `auth.webauthn_credentials`, alinhado ao modelo atual de passkeys.
- Componentes obsoletos `src/components/sync` e `src/components/sync-history` foram removidos; o modulo compartilhado agora vive em `src/features/sync`.
- Sincronizacao manual de unidades/clientes/veiculos executa direto em `AlertDialog` bloqueante com `AppEmptyState` e spinner, sem botoes ou fechamento enquanto a chamada esta pendente.
- Historico de sincronizacao usa `AppEmptyState` como fallback e exibe `error_details` das execucoes.
- Falhas TLS do ERP deixam de ser tratadas como retry transitivo e retornam mensagem operacional sobre `ERP_BASE_URL`/certificado sem desabilitar validacao TLS.
- Layout global protegido contra rolagem horizontal fora das regioes rolaveis internas.
- Sidebar revisado para logo maior, mais espacamento entre grupos, trigger maior e grupos abertos em modo colapsado para manter icones visiveis.
- `Button`, `Input`, `Select`, `NativeSelect`, `InputGroup`, `CommandInput` e `Combobox` alinhados para altura base `h-9`; botoes de acao usam `lg` por padrao.
- Variantes `destructive` de `Button` e `Badge` usam fundo destrutivo solido.
- Filtros facetados da `DataTable` usam `ComboboxCollection`, requisito do Base UI para colecoes renderizadas por funcao.
- Exportacao XLSX da `DataTable` ignora colunas nao exportaveis e usa `columnDef.meta.exportValue` para valores legiveis.
- Formularios de precos e regras VIP deixam de aceitar codigo/nome livre em campos criticos e passam a selecionar unidade, cliente, veiculo e unidades a partir dos cadastros carregados.
- Listagem de usuarios nao falha mais quando enriquecimentos auxiliares de unidade, ultimo acesso ou passkeys indisponibilizam; a tabela principal continua carregando.
- Perfis e permissoes mantem Edge Function como caminho principal e usam leitura direta com RLS como fallback.
- HMAC das Edge Functions preserva `CPF_HMAC_SECRET` como prioridade para nao invalidar hashes existentes quando `APP_HMAC_SECRET` estiver configurado.

## Evidencias remotas

- Projeto alvo Supabase: `zgzzfytlzsntzhzqxqvc`.
- `supabase db push --linked`: banco remoto atualizado, sem migration pendente.
- `APP_HMAC_SECRET` e `APP_ALLOWED_ORIGINS` configurados no projeto alvo via `supabase secrets set`.
- Funcoes publicadas: `admin-phone-change-review`, `admin-recovery-review`, `admin-user-auth-factors`, `admin-user-block`, `admin-user-clear-lock`, `admin-user-create`, `admin-user-reset-passkey`, `admin-user-reset-password`, `admin-user-revoke-sessions`, `admin-user-update`, `auth-complete-passkey`, `auth-passkey-login`, `auth-password`, `auth-recovery-request`, `auth-register-passkey`, `clients-sync`, `list-permission-matrix`, `profile-change-password`, `profile-request-phone-change`, `units-sync`.
- `units-sync` e `clients-sync` estao com `verify_jwt = false` porque implementam autenticacao propria por JWT do usuario ou `x-sync-secret` para cron.
- Usuario `Igor Nicoletti`: existe em `public.app_users`, `role = owner`, `status = active`, com `auth_user_id`.
- Matriz de permissoes remota: 12 grupos, 16 permissoes ativas, 61 vinculos `role_permissions`.
- Tabelas `erp_units`, `erp_clients` e `erp_client_vehicles` estao vazias no projeto alvo.
- Ultimas sincronizacoes de unidades/clientes falharam por `invalid peer certificate: NotValidForName` em `https://hubapi.redemontecarlo.com.br/...`, indicando incompatibilidade entre host configurado/certificado do ERP.
- Crons `unit-sync-incremental`, `unit-sync-full`, `client-sync-incremental` e `client-sync-full` estao ativos no projeto alvo.

## Fontes oficiais consultadas

- Supabase CLI config: <https://supabase.com/docs/guides/local-development/cli/config>
- Supabase Edge Functions deploy: <https://supabase.com/docs/guides/functions/deploy>
- Supabase Edge Functions secrets: <https://supabase.com/docs/guides/functions/secrets>
- Supabase Edge Functions configuration: <https://supabase.com/docs/guides/functions/function-configuration>
- Supabase Auth sessions: <https://supabase.com/docs/guides/auth/sessions>
- Supabase Auth passkeys: <https://supabase.com/docs/guides/auth/passkeys>
- Supabase Scheduling Edge Functions: <https://supabase.com/docs/guides/functions/schedule-functions>
- Supabase RLS/securing APIs: <https://supabase.com/docs/guides/api/securing-your-api>
- OWASP Authentication Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html>
- OWASP Session Management Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>
- MDN Web Authentication API: <https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API>
- W3C WebAuthn Level 3: <https://www.w3.org/TR/webauthn-3/>
- TanStack Table filtering APIs: <https://tanstack.com/table/v8/docs/api/features/column-filtering>
- TanStack Table core APIs: <https://tanstack.com/table/v8/docs/api/core/table>
- shadcn/ui Button: <https://ui.shadcn.com/docs/components/base/button>
- shadcn/ui Combobox: <https://ui.shadcn.com/docs/components/radix/combobox>
- MDN `overflow-x`: <https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-x>

## Validacao executada

- `pnpm validate`
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm lint`
- `pnpm build`
- `pnpm test` completo: 34 arquivos, 81 testes passando.
- `deno check` em todas as Edge Functions locais publicadas.
- Testes direcionados por lotes cobrindo todos os arquivos em `tests/`.

Observacao: uma tentativa com a flag invalida `--runInBand` falhou porque essa opcao nao existe no Vitest; a execucao correta com `pnpm test` passou.
