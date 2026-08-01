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

### Crons atuais — revisão de 01/08/2026

- Clientes incremental: `0 9,15,21 * * *`.
- Clientes full: `0 3 * * *`.
- Retomada de veículos: `*/5 * * * *`, somente quando `client_sync_state.last_cursor` contém uma partição pendente.
- Unidades incremental/full: `0 9,15,21 * * *` e `0 3 * * *`.
- Lock distribuído com TTL de 300s, cursor com validade de duas horas e checkpoint global somente após a última partição.
- URL e segredos service-to-service ficam no Vault; `cron.job` contém apenas chamadas a helpers privados.

### Evidência de escala real

- Fonte ERP: 236.453 registros de veículos no baseline full.
- Destino após filtro/canonicalização: 28.552 clientes e 124.912 veículos ativos.
- Resultado: IDs e placas sem duplicatas; oito partições de veículos entre 11 e 16 segundos cada.
- A primeira tentativa monolítica reproduziu `546`; a versão particionada terminou com nove respostas HTTP 200 consecutivas.
- Onze payloads inválidos foram registrados como warning com índice de origem, sem descartar ou mascarar a evidência do erro.

## Melhorias Robustas Aplicadas

### Edge Function `clients-sync`

- Hash não criptográfico determinístico para change detection, evitando uma operação Web Crypto por linha.
- Upsert em lotes de 500 e canonicalização determinística de placas repetidas.
- Clientes e veículos são fases distintas; veículos usam oito partições estáveis por placa e cursor retomável.
- Consultas de clientes ativos usam apenas os IDs da partição, em lotes, evitando varredura repetida do conjunto completo.
- Contadores usam as colunas reais `*_rejected`; falha de histórico não é convertida em sucesso.

### Edge Function `units-sync`

- Upsert em lotes (`chunk`) para `erp_units`.
- Fallback seguro para diffs massivos (acima de 5k IDs): preserva execução evitando gargalo de hash diff por `IN` gigante.

### Frontend `clients-gateway`

- Limite de lotes aumentado para suportar até 60k registros ativos com batch de 500.

## Veredito técnico atualizado

### Homologação com ERP real

- Concluída no projeto remoto com baseline full e dados produtivos.

### Operação produtiva

- Fluxo habilitado com Vault, timeout explícito, retry por cursor, lock e cron configurados.
- Monitorar P50/P95, warnings de qualidade do ERP, idade do cursor e falhas consecutivas; o baseline não substitui observação contínua.

## Próximos passos recomendados

1. Negociar paginação/cursor na API do ERP para evitar baixar o payload completo em cada partição; o endpoint atual não documenta esse contrato.
2. Criar alerta operacional para cursor próximo de duas horas e `consecutive_failures > 0`.
3. Acompanhar os 11 registros inválidos na origem e formalizar a regra de correção, sem inventar defaults no destino.
4. Ajustar frequência ou quantidade de partições somente após uma janela representativa de P50/P95.
