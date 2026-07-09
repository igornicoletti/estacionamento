# Estado Atual do Projeto — Rede Monte Carlo

Data da auditoria: 2026-07-05

---

## Arquitetura Geral

| Camada | Tecnologia |
| -------- | ----------- |
| Frontend | React 19 + TypeScript 6 + Vite |
| UI | shadcn/ui (Base UI + Radix UI) + Tailwind CSS 4 |
| Tabelas | @tanstack/react-table 8 |
| Roteamento | React Router 8 |
| Backend | Supabase (Auth + Postgres + Edge Functions) |
| Testes | Vitest + Testing Library |

---

## Estrutura de Features

| Feature | Diretório | Gateway | Hooks | Rotas | Testes |
| --------- | ----------- | --------- | ------- | ------- | -------- |
| Unidades | `src/features/units` | `units-gateway.ts`, `unit-yard-gateway.ts` | `use-units`, `use-unit-users`, `use-unit-yard-configs`, `use-unit-sync-history` | `units-route`, `unit-users-route` | Sim |
| Clientes | `src/features/clients` | `clients-gateway.ts` | `use-clients`, `use-client-vehicles` | `clients-route`, `client-vehicles-route` | Sim |
| Usuários | `src/features/users` | `users-gateway.ts` | `use-users` | `users-route` | Sim |
| Auditoria | `src/features/audit` | In-memory + localStorage | `use-audit` | `audit-route` | Parcial |
| Permissões | `src/features/permissions` | Derivado de `auth` | `use-permissions` | `permissions-route` | Sim |
| Notificações | `src/features/notifications` | In-memory | `use-notifications` | `notifications-route` | Sim |
| Regras VIP | `src/features/rules` | Supabase + localStorage fallback | `use-vip-rules` | `rules-route` | Sim |
| Configurações | `src/features/settings` | In-memory | `use-settings` | `settings-route` | Parcial |
| Preços | `src/features/prices` | Supabase + localStorage fallback | `use-prices` | `prices-route` | Sim |
| Auth | `src/features/auth` | Supabase Edge Functions | `useAuthSession`, `useAuthFlow`, `usePasskey` | Auth routes | Sim |

---

## Padrão de Gateway

Todas as features de dados ERP seguem o padrão:

1. **Gateway interface** — contrato de acesso a dados (`XxxGateway`)
2. **Mock gateway** — implementação in-memory para desenvolvimento
3. **Funções de configuração** — `getXxxGateway()`, `configureXxxGateway()`, `resetXxxGateway()`
4. **Service** — lógica de negócio que consome o gateway
5. **Normalizer** — sanitização de payloads ERP em tipos seguros

### Gateways que precisam de implementação Supabase real

| Gateway | Arquivo atual | Tabela Supabase esperada |
| --------- | -------------- | ------------------------- |
| `UnitsGateway` | `src/features/units/services/units-gateway.ts` | View de API ERP ou tabela `units` |
| `ClientsGateway` | `src/features/clients/services/clients-gateway.ts` | View de API ERP ou tabela `clients` + `client_vehicles` |
| `UsersGateway` | `src/features/users/services/users-gateway.ts` | `app_users` (já existe na migration 0001) |
| `UnitYardGateway` | `src/features/units/services/unit-yard-gateway.ts` | Tabela nova `unit_yard_configs` |
| Audit | `src/features/audit/services/audit-service.ts` | `audit_events` (já existe na migration 0003) |
| Notifications | `src/features/notifications/services/notifications-service.ts` | Tabela nova `notifications` |
| VIP Rules | `src/features/rules/services/vip-rules-service.ts` | Tabela nova `commercial_rules` |
| Prices | `src/features/prices/services/prices-service.ts` | Tabelas novas `commercial_price_tables` + `commercial_price_tiers` |
| Settings | `src/features/settings/services/settings-service.ts` | `app_users` (campos de preferência) |

---

## Modelo de Autorização

### Papéis (UserRole)

| Papel | Escopo | Capacidades principais |
| ------- | -------- | ---------------------- |
| `owner` | Global | Tudo (admin + audit + commercial + security) |
| `admin` | Global | Tudo (igual a owner) |
| `auditor` | Global | Leitura (audit, commercial, security, admin read) |
| `manager` | Unidade | Self-service apenas |
| `operator` | Unidade | Self-service apenas |

### Capacidades por rota

| Rota | Capacidade requerida |
| ------ | --------------------- |
| `/unidades` | `admin.units.read` |
| `/clientes` | `admin.clients.read` |
| `/usuarios` | `admin.users.read` |
| `/auditoria` | `audit.read` |
| `/perfis-permissoes` | `security.permissions.read` |
| `/precos` | `commercial.prices.read` |
| `/regras` | `commercial.rules.read` |
| `/notificacoes` | `profile.readSelf` |
| `/configuracoes` | `profile.readSelf` |

Arquivo de referência: `src/features/auth/authorization/authorization-policy.ts`

---

## Infraestrutura Supabase

### Migrations aplicadas

| Migration | Descrição |
| ----------- | ----------- |
| `0001_auth_domain_schema.sql` | Schema base: `app_users`, enums de role/status |
| `0002_auth_rls_policies.sql` | Políticas RLS para users, units e audit |
| `0003_auth_audit_rate_limit.sql` | Tabela `audit_events` com indexação |
| `0004_auth_recovery_requests.sql` | Tabela `access_recovery_requests` |
| `0005_auth_session_revocation.sql` | Função `private.revoke_auth_sessions()` |

### Migrations locais pendentes de aplicação

| Migration | Descrição |
| ----------- | ----------- |
| `20260709084549_commercial_prices_rules.sql` | Preços e regras comerciais com RLS |

### Edge Functions

| Função | Autenticação | Descrição |
| -------- | ------------- | ----------- |
| `auth-start` | Pública | Iniciar fluxo de autenticação |
| `auth-password` | Pública | Login com senha |
| `auth-recovery-request` | Pública | Solicitar recuperação de acesso |
| `auth-complete-passkey` | JWT | Completar registro de passkey |
| `auth-register-passkey` | JWT | Registrar nova passkey |
| `admin-user-create` | JWT | Criar usuário (admin) |
| `admin-user-reset-password` | JWT | Redefinir senha |
| `admin-user-reset-passkey` | JWT | Redefinir passkey |
| `admin-user-clear-lock` | JWT | Desbloquear conta |
| `admin-user-revoke-sessions` | JWT | Revogar sessões ativas |
| `profile-change-password` | JWT | Alterar senha própria |
| `profile-request-phone-change` | JWT | Solicitar alteração de telefone |

---

## Melhorias Aplicadas (Revisão 2026-07-05)

### Segurança

- Dev bypass em `auth-api.ts` e `auth-session.ts` agora protegido com `import.meta.env.DEV` para tree-shaking em produção
- Removida função `withDevelopmentOwnerRole()` que escalava privilégios na camada de sessão
- `syncDevelopmentSessionProfileFromUser()` não sobrescreve mais o papel do perfil de desenvolvimento
- Input de nome MFA sanitizado com trim e limite de 100 caracteres
- `writeDataTableSnapshot()` e `writeStoredAuditEvents()` protegidos contra `QuotaExceededError`

### Performance

- Cache de `useAsyncSnapshot` agora tem TTL de 5 minutos e limite de 50 entradas (evita memory leak)
- Concorrência manual removida de `setNotificationsStatus()` — serialização previne race conditions
- `appendAuditEvent()` aceita actor context como parâmetro (evita fetch desnecessário)
- Audit append em `unit-yard-service.ts` agora é `await` com catch (não fire-and-forget)

### Código legado removido

- `src/lib/result.ts` deletado (tipo Result nunca utilizado)
- Função `normalizeConcurrency()` removida de notifications-service
- Lógica de concurrency option removida de callers

### Acessibilidade

- DataTable agora inclui `<caption>` com contagem de registros para leitores de tela
- Atributos `aria-rowcount` e `aria-colcount` adicionados ao elemento `<Table>`

---

## Pendências para próximas fases

### Testes

- [ ] Settings service: sem testes de serviço
- [ ] Hooks customizados: sem testes unitários (use-notifications, use-vip-rules, use-settings)
- [ ] Migrar testes de `fireEvent` para `userEvent`
- [ ] Adicionar MSW para mock de API nos testes

### Implementação Supabase

- [ ] Criar gateways reais para cada feature conectando ao Postgres via Supabase client
- [ ] Implementar sincronização ERP (cron com pg_cron + edge functions)
- [ ] Criar tabelas novas: `unit_yard_configs`, `notifications`
- [ ] Implementar RLS para novas tabelas
- [ ] Configurar migrations para schema de sincronização

### Features pendentes

- [ ] CRUD comercial de preços e benefício de abastecimento após requisitos formais de aprovação/auditoria
- [ ] Fluxo visual do botão Sincronizar em Unidades
- [ ] Histórico de sincronização para Clientes (layout pronto em Unidades, compartilhar)
- [ ] Notificações de falha de sincronização (3 falhas consecutivas)
