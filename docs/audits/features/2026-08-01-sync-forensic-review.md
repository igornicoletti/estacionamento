# Revisão forense — `src/features/sync`

Data da revisão: 2026-08-01
Estado: implementação operacional concluída nesta onda.

## Resultado

A feature passou a compor o histórico e a execução manual reais de Clientes e Unidades. As rotas apenas fornecem o recurso e o callback de releitura; I/O permanece no gateway Supabase, payloads externos passam por Zod e a orquestração sequencial fica no serviço.

```text
ClientsRoute / UnitsRoute
-> SyncOperations
-> SyncHistorySheet | SyncDialog
-> useSyncHistory | useSyncController
-> sync-service
-> SyncGateway
-> Data API + clients-sync / units-sync
```

## Contratos

- `sync.execute` autoriza execução manual;
- `sync.execute` ou `audit.read` autoriza leitura do histórico;
- Clientes executa primeiro o cliente e depois as partições de veículos, sempre sequencialmente;
- uma execução só produz sucesso após o respectivo registro aparecer no histórico;
- status persistido `failed`, ausência de `runId`, resposta inválida ou erro remoto nunca produz mensagem de sucesso;
- o diálogo bloqueia cancelamento durante a execução e usa duração histórica real para estimativa;
- fixtures e gateways em memória permanecem exclusivamente em `tests/helpers`.

## UI e acessibilidade

- Histórico usa Sheet titulado, timeline expansível, estados de loading, vazio e erro;
- execução usa Dialog titulado, confirmação, progresso, resultado e retry;
- o estado inicial exibe ícone do recurso e dados reais da última execução: status, término, duração, modo e origem;
- status usam tons semânticos suaves `success`, `warning` e `error`;
- o diálogo foi validado em `390 × 844` sem overflow horizontal.

## Segurança

- o browser nunca recebe `service_role` ou segredo ERP;
- gateway falha fechado quando Supabase está ausente;
- RLS do histórico exige capability e as Edge Functions continuam autoritativas para execução;
- mensagens técnicas ficam em `cause`; a UI recebe mensagens públicas estáveis;
- requests não carregam CPF, token, segredo ou credencial em URL/log.

## Testes

| Arquivo | Cobertura |
| --- | --- |
| `sync-gateway-schemas.test.ts` | wire válido, campos extras e status inválido |
| `sync-service.test.ts` | histórico, estimativa, fases sequenciais e falha persistida |
| `sync-components.test.tsx` | timeline, última execução, bloqueio, sucesso verificável e erro remoto |

As migrations aditivas desta onda são `20260801174245_harden_permission_catalog_boundary.sql` e `20260801221800_harden_unit_sync_history_access.sql`.
