# Relatório Forense - Catálogo ERP, Legado e Mock

Data: 2026-07-15  
Projeto atual: `igornicoletti/estacionamento`  
Projeto legado analisado: `projetosmc/estacionamento`  
Projeto Supabase atual confirmado: `zgzzfytlzsntzhzqxqvc`

## Resumo executivo

O projeto atual já possui a arquitetura correta para consumir unidades, clientes e veículos a partir do Supabase (`erp_units`, `erp_clients`, `erp_client_vehicles`) e já isola o acesso por gateways (`UnitsGateway`, `ClientsGateway`). O problema principal não está na tabela nem na `DataTable`: o banco atual está sem carga nesses três cadastros.

Consulta direta ao Supabase atual retornou:

| Tabela | Linhas |
| --- | ---: |
| `public.erp_units` | 0 |
| `public.erp_clients` | 0 |
| `public.erp_client_vehicles` | 0 |
| `public.unit_sync_runs` | 18 |
| `public.client_sync_runs` | 4 |

O relatório anterior do próprio repositório já registrava falha de sincronização por TLS no ERP (`invalid peer certificate: NotValidForName`) e tabelas vazias. A análise atual confirma esse estado.

Foi implementado um mock sintético, versionável e protegido por flag de desenvolvimento:

- `VITE_ERP_CATALOG_MOCK_ENABLED=true`
- não grava nada no Supabase;
- não substitui migrations;
- não ativa em produção;
- injeta dados nos gateways existentes de unidades, clientes e veículos;
- não implementa nada de pátio virtual.

Validação executada após a implementação:

```bash
pnpm validate
pnpm typecheck
pnpm lint
pnpm test -- tests/config/env.test.ts tests/features/units/units-service.test.ts tests/features/clients/clients-service.test.ts
pnpm build
```

Resultado: validação estrutural, typecheck, lint, 37 arquivos de teste / 126 testes e build passaram.

## Escopo e limites

Incluído:

- análise crítica do repositório atual;
- análise dedutiva das tabelas atuais de unidades, clientes e veículos;
- consulta Supabase no projeto atual;
- tentativa de consulta Supabase no projeto legado;
- extração de contrato do GitHub legado;
- levantamento de campos reais do legado;
- criação de mock sintético para destravar telas e formulários dependentes desses cadastros;
- relatório com prioridades, riscos e plano de implementação.

Excluído por solicitação:

- nenhuma implementação de pátio virtual;
- nenhuma carga sintética gravada no Supabase remoto;
- nenhuma alteração em dados reais de legado ou produção.

Limitação factual:

- o Supabase do legado (`sxhdvpetdogoobmubjdp`) retornou `You do not have permission to perform this action` para `list_tables` e `execute_sql`. Portanto, não foi possível consultar linhas reais do legado pelo conector. A análise do legado foi feita via contrato GitHub (`src/integrations/supabase/types.ts`) e arquivos de domínio.

## Evidências do projeto atual

### Tabelas atuais

`supabase/migrations/0007_units_sync_schema.sql` cria:

- `public.erp_units`
- `public.unit_yard_configs`
- `public.unit_sync_runs`
- `public.unit_sync_state`

`supabase/migrations/0009_clients_sync_schema.sql` cria:

- `public.erp_clients`
- `public.erp_client_vehicles`
- `public.client_sync_runs`
- `public.client_sync_state`

Campos atuais relevantes:

| Domínio | Tabela | Chave | Campos de uso na UI |
| --- | --- | --- | --- |
| Unidades | `erp_units` | `cod_empresa` | `nom_razao_social`, `nom_fantasia`, `num_cnpj`, `des_bandeira`, `nom_cidade`, `sgl_estado`, `ip_rede`, `nom_banco_dados` |
| Clientes | `erp_clients` | `cod_pessoa` | `nom_pessoa`, `nom_fantasia`, `num_cnpj_cpf`, `des_email_1`, `num_telefone_1`, `nom_cidade`, `sgl_estado`, `qtd_veiculos`, `dta_ultima_compra`, `is_active_120d` |
| Veículos | `erp_client_vehicles` | `cod_veiculo` | `cod_pessoa`, `num_placa`, `des_veiculo`, `nom_motorista`, `client_is_active_120d` |

### Fluxo frontend atual

| Arquivo | Achado |
| --- | --- |
| `src/features/units/services/units-gateway.ts` | Lê `erp_units`, normaliza e expõe por `listUnits`. |
| `src/features/clients/services/clients-gateway.ts` | Lê `erp_clients` e `erp_client_vehicles` em lotes de 500, até 20 páginas. |
| `src/hooks/use-async-snapshot.ts` | Cache local de snapshots por 5 minutos; bom para catálogos pequenos/médios. |
| `src/features/prices/components/price-table-form-dialog.tsx` | Depende de `useUnits()` para selecionar unidade em preço unitário. |
| `src/features/rules/components/vip-rule-form-dialog.tsx` | Depende de `listClientsSnapshot()` e `useUnits()` para cliente, veículos e unidades. |

Conclusão: o ponto mais seguro para mock é o gateway, antes dos normalizadores e sem tocar em `DataTable`, rotas ou formulários.

## Evidências do legado

Arquivos legados analisados via GitHub:

- `src/integrations/supabase/types.ts`
- `src/features/unidades/unidadesData.ts`
- `src/features/unidades/unidadesContracts.ts`
- `src/features/clientes/clientesData.ts`
- `src/features/clientes/clientesContracts.ts`
- `src/features/placas/placasContracts.ts`
- `src/features/regras/regrasData.ts`
- `src/lib/rpcContracts.ts`
- `supabase/functions/sync-clientes/index.ts`

### Contrato legado de unidades

Tabela: `public.tab_unidades`

Campos relevantes:

| Campo legado | Interpretação | Destino atual sugerido |
| --- | --- | --- |
| `seq_unidade` | chave interna local do legado | não usar como chave atual sem validação |
| `cod_unidade` | código externo/operacional da unidade | `erp_units.cod_empresa` se confirmado com ERP |
| `des_unidade` | nome da unidade | `nom_fantasia` e fallback para `nom_razao_social` |
| `cod_cnpj` | CNPJ | `num_cnpj` |
| `des_bandeira` | bandeira | `des_bandeira` |
| `des_cidade` | cidade | `nom_cidade` |
| `sgl_uf` | UF | `sgl_estado` |
| `des_ip` | IP/rede | `ip_rede` |
| `des_banco_dados` | banco de origem | `nom_banco_dados` |
| `qtd_vagas` | vagas da unidade | pátio/ocupação; não implementar agora |

Risco principal: confirmar se `cod_unidade` corresponde a `cod_empresa` do ERP atual. Se a chave for trocada por `seq_unidade`, regras/preços podem ficar apontando para unidades erradas.

### Contrato legado de clientes

Tabela: `public.tab_clientes`

Campos relevantes:

| Campo legado | Interpretação | Destino atual sugerido |
| --- | --- | --- |
| `seq_cliente` | chave interna local do legado | usar apenas para joins com `tab_placas` no legado |
| `cod_pessoa` | código externo do cliente | `erp_clients.cod_pessoa` |
| `des_cliente` | razão/nome | `nom_pessoa` |
| `des_nome_fantasia` | nome fantasia | `nom_fantasia` |
| `cod_cpf_cnpj` | documento | `num_cnpj_cpf` |
| `des_email` | email | `des_email_1` |
| `des_telefone` | telefone | `num_telefone_1` |
| `des_cidade` | cidade | `nom_cidade` |
| `sgl_uf` | UF | `sgl_estado` |
| `dta_cadastro_externo` | cadastro no ERP | `dta_cadastro` |
| `ind_status` | ativo/inativo | `ind_pessoa_ativa` |
| `ind_bloqueio_financeiro` | bloqueio | `bloqueio_financeiro` |
| `qtd_veiculos` | quantidade | `qtd_veiculos` |
| `dta_ultima_compra` | atividade recente | `dta_ultima_compra` |
| `ind_elegibilidade` | elegibilidade operacional | `is_active_120d` |

Risco principal: o legado separa `seq_cliente` e `cod_pessoa`. Veículos usam `seq_cliente`; o projeto atual usa `cod_pessoa`. A migração real precisa fazer join `tab_placas.seq_cliente -> tab_clientes.seq_cliente -> tab_clientes.cod_pessoa`.

### Contrato legado de veículos

Tabela: `public.tab_placas`

Campos relevantes:

| Campo legado | Interpretação | Destino atual sugerido |
| --- | --- | --- |
| `seq_placa` | chave interna local | não usar como chave externa sem validação |
| `cod_veiculo` | código externo do veículo | `erp_client_vehicles.cod_veiculo` |
| `seq_cliente` | vínculo legado com cliente | converter para `cod_pessoa` via `tab_clientes` |
| `num_placa` | placa | `num_placa` |
| `des_veiculo` / `des_modelo` | descrição | `des_veiculo` |
| `des_motorista` | motorista | `nom_motorista` |
| `ind_status` | ativo/inativo | usado para filtro antes de mock/carga |
| `ind_bloqueio` | bloqueio operacional | não existe igual no schema atual |

Risco principal: placas sem cliente correspondente devem ser rejeitadas ou registradas como inconsistência, como a Edge Function atual já faz com `missing_client`.

### Regras VIP no legado

O legado usa:

- `tab_clientes.ind_vip`
- `tab_clientes.ind_vip_auto_novas_placas`
- `tab_clientes_vip_unidades`
- `tab_clientes_vip_placas_excluidas`
- `rpc_set_vip_cliente`
- `rpc_toggle_vip_placa`

O projeto atual usa `commercial_rules` e `save_commercial_rule_version`.

Dedução: não migrar VIP como flag direta no mock. O mock deve apenas fornecer clientes/veículos para seleção. Regras VIP devem continuar nas tabelas comerciais atuais, auditadas e versionadas.

## Achados críticos

### P0 - Cadastros ERP vazios no Supabase atual

Impacto:

- `/unidades` carrega empty state;
- `/clientes` carrega empty state;
- `/clientes/:cod_pessoa` não encontra veículos;
- formulário de preços não tem opções reais de unidade;
- formulário de regras VIP não tem clientes/veículos para selecionar.

Correção aplicada:

- mock sintético por gateway e flag `VITE_ERP_CATALOG_MOCK_ENABLED`;
- não grava dados sintéticos no banco.

### P0 - Mock não pode mascarar problema de produção

Risco:

- uma carga mock em produção poderia gerar regras/preços sobre IDs sintéticos.

Correção aplicada:

- `src/config/env.ts` bloqueia `VITE_ERP_CATALOG_MOCK_ENABLED=true` em `PROD`;
- gateways só usam mock quando `import.meta.env.DEV` está ativo.

### P0 - Pátio virtual fora do escopo pedido

Achado:

- o projeto atual ainda tem `src/features/yard/routes/yard-route.tsx`;
- `route-registry.ts` expõe `/patio-virtual`;
- regras incluem tipos `yard_cleaning`, `yard_cleaning_occupancy`, `yard_cleaning_stale_vehicle`;
- `unit_yard_configs` existe e é usado por unidades/regras.

Diretriz:

- não evoluir pátio virtual nesta fase;
- não misturar mock de unidades/clientes/veículos com `unit_yard_configs`;
- se necessário, congelar a rota/ação em uma etapa separada, com decisão explícita.

### P1 - Supabase legado inacessível pelo conector

Impacto:

- não foi possível buscar amostra real de linhas do legado;
- não foi possível validar cardinalidade, distribuição de clientes, placas órfãs ou dados sensíveis.

Plano:

- conceder acesso temporário de leitura ao projeto legado ou exportar amostra sanitizada;
- extrair no máximo poucas dezenas de clientes e veículos para validação;
- não usar CPF/CNPJ real em mock versionado.

### P1 - Advisors do Supabase atual ainda têm alertas

Security advisor:

| Nível | Lint | Quantidade | Exemplos |
| --- | --- | ---: | --- |
| `WARN` | `authenticated_security_definer_function_executable` | 3 | `create_commercial_price_table`, `save_commercial_rule_version`, `set_all_notifications_read_status` |
| `WARN` | `extension_in_public` | 1 | `btree_gist` em `public` |
| `WARN` | `auth_leaked_password_protection` | 1 | proteção contra senhas vazadas desabilitada |
| `INFO` | `rls_enabled_no_policy` | 6 | `app_session_activity`, `auth_flow_attempts`, `auth_rate_limits`, `email_verification_attempts`, `phone_verification_attempts`, `sync_locks` |

Performance advisor:

| Nível | Lint | Quantidade |
| --- | --- | ---: |
| `INFO` | `unindexed_foreign_keys` | 19 |
| `INFO` | `unused_index` | 31 |

Observação: índices em tabelas vazias tendem a aparecer como "unused"; não remover antes de haver carga e uso real.

### P1 - Documentação de env estava divergente

Achado:

- `README.md` citava `VITE_SUPABASE_ANON_KEY`;
- o código usa `VITE_SUPABASE_PUBLISHABLE_KEY`.

Correção aplicada:

- `README.md` atualizado para `VITE_SUPABASE_PUBLISHABLE_KEY`;
- `.env.example` atualizado com `VITE_ERP_CATALOG_MOCK_ENABLED=false`.

## Mock implementado

Arquivos criados:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/features/erp-mock/erp-catalog-mock-data.ts` | Dados sintéticos compatíveis com `ErpUnitPayload`, `ErpClientPayload` e `ErpClientVehiclePayload`. |
| `src/features/erp-mock/index.ts` | API pública do mock. |
| `src/features/erp-mock/README.md` | Responsabilidade e decisão técnica. |

Arquivos alterados:

| Arquivo | Alteração |
| --- | --- |
| `src/config/env.ts` | Nova flag `erpCatalogMockEnabled`, bloqueada em produção. |
| `src/features/units/services/units-gateway.ts` | Usa `mockErpUnitsPayload` quando a flag está ativa. |
| `src/features/clients/services/clients-gateway.ts` | Usa `mockErpClientsPayload` e `mockErpClientVehiclesPayload` quando a flag está ativa. |
| `src/vite-env.d.ts` | Tipagem da nova env pública. |
| `.env.example` | Exemplo da flag. |
| `README.md` | Documentação da env e correção da chave Supabase. |
| `src/features/units/README.md` | Decisão sobre mock dev-only. |
| `src/features/clients/README.md` | Decisão sobre mock dev-only. |

Dados sintéticos:

| Tipo | Quantidade |
| --- | ---: |
| Unidades | 5 |
| Clientes | 5 |
| Veículos | 12 |

Uso local:

```env
VITE_ERP_CATALOG_MOCK_ENABLED=true
```

Garantias:

- IDs são sintéticos;
- emails usam domínio `.example`;
- não há dado real de CPF/CNPJ;
- não há escrita remota;
- não há alteração em pátio virtual.

## Plano de produção

### Fase 1 - Mock controlado

Objetivo: destravar UI e formulários enquanto o ERP não fornece token.

Checklist:

- manter `VITE_ERP_CATALOG_MOCK_ENABLED=false` por padrão;
- ativar somente em `.env.local`;
- validar `/unidades`, `/clientes`, `/clientes/:cod_pessoa`, `/precos` e `/regras`;
- não criar regras/preços definitivos com IDs mockados no banco de produção.

### Fase 2 - Corrigir sincronização ERP

Objetivo: trocar mock por carga real.

Checklist:

- validar `ERP_BASE_URL` contra certificado TLS correto;
- definir autenticação oficial: `ERP_API_TOKEN`, `ERP_BEARER_TOKEN` ou Basic;
- validar endpoints:
  - `ERP_UNITS_ENDPOINT`
  - `ERP_CLIENTS_ENDPOINT`
  - `ERP_CLIENT_VEHICLES_ENDPOINT`
- executar sync incremental e full em ambiente seguro;
- conferir counters em `unit_sync_runs` e `client_sync_runs`;
- exigir que `erp_units`, `erp_clients` e `erp_client_vehicles` tenham linhas antes de desligar mock.

### Fase 3 - Migração assistida do legado

Objetivo: usar legado como validador e ponte temporária, sem virar fonte definitiva.

Checklist:

- obter acesso read-only ao Supabase legado;
- extrair amostra pequena e sanitizada;
- mapear `tab_unidades.cod_unidade` para `erp_units.cod_empresa`;
- mapear `tab_clientes.cod_pessoa` para `erp_clients.cod_pessoa`;
- converter placas com join em `tab_clientes`;
- descartar ou registrar placas sem cliente;
- não transportar dados de pátio virtual nesta fase.

### Fase 4 - Remover mock

Objetivo: encerrar fallback sintético.

Checklist:

- confirmar carga real em produção;
- manter testes de gateway por injeção (`configureUnitsGateway`, `configureClientsGateway`);
- remover `VITE_ERP_CATALOG_MOCK_ENABLED` se não houver mais necessidade;
- manter relatório de migração com contagens antes/depois.

## Referências oficiais

- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Securing your API: https://supabase.com/docs/guides/api/securing-your-api
- Supabase Database Linter: https://supabase.com/docs/guides/database/database-linter
- Supabase Edge Functions secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase JavaScript `select`: https://supabase.com/docs/reference/javascript/select
- Supabase JavaScript `rpc`: https://supabase.com/docs/reference/javascript/rpc
- Supabase TypeScript types: https://supabase.com/docs/guides/api/rest/generating-types
- TanStack Query React overview: https://tanstack.com/query/latest/docs/framework/react/overview
- TanStack Table data guide: https://tanstack.com/table/v8/docs/guide/data
- React Router routing: https://reactrouter.com/start/data/routing

## Decisão final

O projeto atual está pronto para consumir catálogos reais assim que o ERP estiver corrigido, mas hoje precisa de um fallback explícito para desenvolvimento. O mock foi criado no ponto certo da arquitetura, com proteção contra produção e sem contaminação de dados remotos.

Para produção real, a prioridade não é aumentar o mock: é corrigir a sincronização, obter acesso read-only ao legado quando necessário e validar a equivalência das chaves antes de migrar qualquer dado.
