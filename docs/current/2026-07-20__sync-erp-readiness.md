# Forensic Sync Readiness — 2026-07-20

## Escopo

Revisão crítica dos fluxos de Unidades, Clientes/Veículos e sincronizações ERP (crons, histórico e robustez para alto volume).

## Achados Funcionais

### 1) Configurar pátio (Unidades)

- Sintoma reportado: ao salvar status + vagas, a coluna de vagas só refletia após refresh.
- Causa provável: atualização visual dependente do retorno/refetch, sem aplicação otimista imediata do payload de entrada.
- Correção aplicada:
  - atualização otimista imediata com `unitId`, `patioActive` e `parkingSpots` antes do roundtrip de persistência;
  - reconciliação posterior com retorno real + refetch.
- Impacto: elimina atraso visual de vagas no grid de unidades.

### 2) Funcionários por unidade

- Status: funcional.
- Evidências:
  - coluna `Funcionários` na tabela de unidades usa soma de `managers + operators` por `unitId`;
  - clique na célula navega para `/unidades/:cod_empresa/usuarios`;
  - tela de usuários da unidade filtra por `unitId` e exibe lista vinculada.

### 3) Distinção Gerentes x Operadores no details

- Status: funcional.
- Evidências:
  - details sheet de unidade exibe campos separados `Gerentes` e `Operadores`.

### 4) Clientes -> Veículos

- Status: funcional.
- Evidências:
  - coluna `Veículos` na tabela de clientes dispara navegação para `/clientes/:cod_pessoa`;
  - tela de veículos filtra por `cod_pessoa` e renderiza apenas veículos do cliente selecionado.

## Achados Forenses de Sincronização ERP

### Crons atuais

- Incremental: `*/30 * * * *` (a cada 30 min)
- Full: `0 3 * * *` (diária às 03:00)
- Lock distribuído com TTL de 300s e sem sobreposição de execução.

### Riscos para escala (30k clientes ativos + veículos)

1. Upsert monolítico em arrays grandes pode causar timeout/memória excessiva.
2. Consultas de diff por `IN (...)` com listas massivas podem estourar limite de payload/URL no PostgREST.
3. Contadores de created/updated/unchanged podem degradar quando o diff exato é inviável em alto volume.

## Melhorias Robustas Aplicadas

### Edge Function `clients-sync`

- Upsert em lotes (`chunk`) para `erp_clients` e `erp_client_vehicles`.
- Fallback seguro para diffs massivos (acima de 5k IDs): pula comparação hash detalhada para preservar conclusão da sync.

### Edge Function `units-sync`

- Upsert em lotes (`chunk`) para `erp_units`.
- Fallback seguro para diffs massivos (acima de 5k IDs): preserva execução evitando gargalo de hash diff por `IN` gigante.

### Frontend `clients-gateway`

- Limite de lotes aumentado para suportar até 60k registros ativos com batch de 500.

## Veredito Técnico (sem certificado ERP)

### Pronto para homologação com ERP real

- Sim, com robustez maior contra estouros de volume e timeout.

### Pronto para produção imediata

- Condicional.
- Recomendado validar em homologação com massa real e monitorar:
  - duração por sync (P50/P95);
  - taxa de warning/failed por janela;
  - volume por lote e impacto em lock TTL;
  - consistência dos históricos (`*_sync_runs`) e auditoria.

## Próximos passos recomendados

1. Adicionar paginação incremental no fetch ERP por cursor/updated_since por página (quando API do ERP suportar).
2. Persistir checkpoints de processamento por bloco para retomada em falhas longas.
3. Instrumentar métricas de cardinalidade por execução (clientes recebidos, ativos, veículos ativos, tempo por fase).
4. Ajustar cron incremental para janela mais curta somente após medição de throughput real (evitar filas concorrentes).
