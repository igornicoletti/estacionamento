# Comparação forense — clients alinhado ao padrão de units

## Base de comparação

Arquivos de referência revisados em `src/features/units`:

- `constants/index.ts`
- `constants/units-persistence.ts`
- `constants/units-routes.ts`
- `constants/units-sync.ts`
- `constants/units-ui.ts`
- `hooks/use-units-table-filters.ts`
- `hooks/use-unit-users-table-filters.ts`
- `hooks/use-unit-sync-history.ts`
- `routes/units-route.tsx`
- `routes/unit-users-route.tsx`
- `services/unit-sync-service.ts`
- `services/unit-sync-history-*`

## Divergências encontradas em clients antes da refatoração

| Área | Divergência | Correção aplicada |
|---|---|---|
| Constantes | Persistência, chaves de tabela, batch e rotas estavam concentradas ou misturadas. | Criados `clients-persistence.ts`, `clients-routes.ts`, `clients-sync.ts` e `clients-ui.ts`. |
| Filtros | Filtros ainda estavam acoplados à pasta `table`. | Criados hooks `useClientsTableFilters` e `useClientVehiclesTableFilters`, seguindo `useUnitsTableFilters`. |
| Histórico de sync | Serviço lia Supabase diretamente, sem gateway por fonte. | Criados `client-sync-history-gateway`, `mock-gateway`, `supabase-gateway`, `normalization` e `types`. |
| Mock de sync | Sincronização mock não registrava histórico de execução. | `triggerClientsSync` registra execução mock em localStorage via gateway, como `units`. |
| Strings mágicas de sync | Função, status, trigger e erro de concorrência estavam inline. | Centralizado em `clients-sync.ts`. |
| Tipagem | `ClientSyncCounters` aceitava índice genérico. | Removido índice genérico e mantidas chaves explícitas. |
| UX de toast | Havia risco de loader via promessa. | Mantidos apenas toasts pós-operação; loader fica no botão/diálogo. |
| Consulta de veículos | Fluxo anterior favorecia snapshot completo. | Mantida consulta isolada por `cod_pessoa` com cache específico. |
| Permissões | Histórico de sync podia ficar sem permissão granular. | Incluída permissão `clients.sync.read` e RLS por permissão efetiva. |
| Dependência legada | O pacote anterior ainda importava componentes/runner de sync fora de `clients`. | Criados `ClientSyncBlockingDialog`, `ClientsSyncHistoryDialog` completo e `executeClientSyncWithRefresh` dentro de `clients`. |
| Visibilidade | Telefone de cliente e documento em veículos estavam ocultos por padrão. | Chaves de visibilidade foram versionadas e os campos sensíveis autorizados ficam visíveis por padrão. |

## Padrão final aplicado

```text
src/features/clients/
├── components/
│   ├── client-sync-blocking-dialog.tsx
│   ├── clients-sync-history-dialog.tsx
│   └── index.ts
├── constants/
│   ├── clients-copy.ts
│   ├── clients-persistence.ts
│   ├── clients-routes.ts
│   ├── clients-sync.ts
│   ├── clients-ui.ts
│   └── index.ts
├── docs/
├── hooks/
│   ├── use-client-sync-history.ts
│   ├── use-client-vehicles-table-filters.ts
│   ├── use-client-vehicles.ts
│   ├── use-clients-table-filters.ts
│   ├── use-clients.ts
│   └── index.ts
├── model/
├── routes/
├── services/
│   ├── client-sync-history-gateway.ts
│   ├── client-sync-history-mock-gateway.ts
│   ├── client-sync-history-normalization.ts
│   ├── client-sync-history-service.ts
│   ├── client-sync-history-supabase-gateway.ts
│   ├── client-sync-history-types.ts
│   ├── client-sync-runner.ts
│   ├── client-sync-service.ts
│   ├── clients-gateway.ts
│   ├── clients-service.ts
│   └── index.ts
└── table/
```

## Resultado da revisão crítica do ZIP anterior

O ZIP anterior foi aberto e auditado. Foram corrigidos dois problemas reais antes do novo pacote:

1. dependência residual de sincronização externa em `src/features/clients`;
2. visibilidade padrão incompatível com o requisito de CPF/documento e telefone visíveis no frontend.

O pacote revisado mantém o padrão estrutural de `units`, mas remove a dependência direta de uma feature de sincronização separada para evitar quebra caso `src/features/sync` seja removido do projeto.
