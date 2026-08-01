# Comparação forense — clients alinhado ao padrão de units

> Documento histórico atualizado em 2026-07-31. As estruturas de histórico e UI de sync descritas como criadas na rodada original foram posteriormente removidas porque não possuíam consumidores.

## Base de comparação

Arquivos de referência revisados em `src/features/units`:

- `constants/index.ts`
- `constants/units-persistence.ts`
- `constants/units-routes.ts`
- `constants/units-sync.ts`
- `constants/units-ui.ts`
- `hooks/use-units-table-filters.ts`
- `hooks/use-unit-users-table-filters.ts`
- `routes/units-route.tsx`
- `routes/unit-users-route.tsx`
- `services/unit-sync-service.ts`

## Divergências encontradas em clients antes da refatoração

| Área | Divergência | Correção aplicada |
|---|---|---|
| Constantes | Persistência, chaves de tabela, batch e rotas estavam concentradas ou misturadas. | Criados `clients-persistence.ts`, `clients-routes.ts`, `clients-sync.ts` e `clients-ui.ts`. |
| Filtros | Filtros ainda estavam acoplados à pasta `table`. | Criados hooks `useClientsTableFilters` e `useClientVehiclesTableFilters`, seguindo `useUnitsTableFilters`. |
| Histórico de sync | Serviço lia Supabase diretamente, sem gateway por fonte. | A primeira rodada criou gateways; a onda de 2026-07-31 os removeu por ausência de consumidor. |
| Mock de sync | Sincronização mock não registrava histórico de execução. | O fallback produtivo foi eliminado; testes usam doubles explícitos e o serviço real permanece sem sucesso sintético. |
| Strings mágicas de sync | Função, status, trigger e erro de concorrência estavam inline. | Centralizado em `clients-sync.ts`. |
| Tipagem | `ClientSyncCounters` aceitava índice genérico. | Removido índice genérico e mantidas chaves explícitas. |
| UX de toast | Havia risco de loader via promessa. | Mantidos apenas toasts pós-operação; loader fica no botão/diálogo. |
| Consulta de veículos | Fluxo anterior favorecia snapshot completo. | Mantida consulta isolada por `cod_pessoa` com cache específico. |
| Resolução do cliente | `/clientes/:cod_pessoa` ainda carregava a lista completa de clientes para resolver título/subtítulo. | Criado `useClient` e `listClientById`, com consulta direta por `cod_pessoa`. |
| Regras VIP | A tela de clientes dependia do hook genérico de regras comerciais, que selecionava colunas não estáveis em `commercial_rules`. | Criados `client-vip-rules-service`, `useClientVipRules` e modelo VIP local com select mínimo. |
| Permissões | Histórico de sync podia ficar sem permissão granular. | Incluída permissão `clients.sync.read` e RLS por permissão efetiva. |
| Dependência legada | O pacote anterior ainda importava componentes/runner de sync fora de `clients`. | A cópia local e a feature genérica foram removidas depois que a análise de alcance confirmou ausência de consumidores. |
| Visibilidade | Telefone de cliente e documento em veículos estavam ocultos por padrão. | Chaves de visibilidade foram versionadas e os campos sensíveis autorizados ficam visíveis por padrão. |

## Padrão final aplicado

```text
src/features/clients/
├── constants/
│   ├── clients-copy.ts
│   ├── clients-persistence.ts
│   ├── clients-routes.ts
│   ├── clients-sync.ts
│   ├── clients-ui.ts
│   └── index.ts
├── docs/
├── hooks/
│   ├── use-client-vehicles-table-filters.ts
│   ├── use-client-vehicles.ts
│   ├── use-client-vip-rules.ts
│   ├── use-client.ts
│   ├── use-clients-table-filters.ts
│   ├── use-clients.ts
├── model/
├── routes/
├── services/
│   ├── client-sync-service.ts
│   ├── client-vip-rules-service.ts
│   ├── clients-gateway.ts
│   ├── clients-service.ts
│   └── index.ts
└── table/
```

## Resultado da revisão crítica do ZIP anterior

O ZIP anterior foi aberto e auditado. Foram corrigidos dois problemas reais antes do novo pacote:

1. dependência residual de sincronização externa em `src/features/clients`;
2. visibilidade padrão incompatível com o requisito de CPF/documento e telefone visíveis no frontend.

O pacote vigente mantém o disparo real de sincronização em cada domínio e não mantém UI/histórico antecipados. `src/features/sync` foi removido após a confirmação de que nenhum consumidor o alcançava.


## Correção forense pós-travamento da página de clientes

A tela de clientes não usa mais `useVipRules` de `src/features/rules`. O status VIP passou para um serviço local com select mínimo em `commercial_rules`, sem `active`, `yard_occupancy_threshold` ou `yard_stale_vehicle_hours`. Isso impede que alterações comerciais novas, schema cache remoto ou migrations pendentes derrubem a tela operacional de clientes.

O toggle VIP continua usando a RPC oficial de versão comercial, mas a leitura de badges VIP é isolada, tolerável a erro e não participa do erro principal da tabela de clientes.
