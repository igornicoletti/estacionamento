# Relatórios e Dashboard a partir de `tab_captura`

Data: 2026-07-21

## Objetivo

Consolidar um levantamento forense inicial para evoluir relatórios, abas e dashboard com base no schema e nos exemplos reais da tabela legada `public.tab_captura`.

Este documento é deliberadamente uma etapa de análise. Nenhuma mudança de UI, API, migration ou contrato de produção deve ser aplicada a partir daqui sem validação posterior contra o banco real e contra os fluxos já suportados pelo projeto.

## Fontes consultadas

- Anexo local: `sql da tab_captura`, contendo DDL, índices, triggers, exemplo CSV, `INSERT` e payload JSON.
- PostgreSQL, generated columns: <https://www.postgresql.org/docs/current/ddl-generated-columns.html>
- PostgreSQL, partial indexes: <https://www.postgresql.org/docs/current/indexes-partial.html>
- shadcn/ui Chart: <https://ui.shadcn.com/docs/components/chart>
- shadcn/ui Charts library: <https://ui.shadcn.com/charts>
- shadcn/ui Data Table: <https://ui.shadcn.com/docs/components/data-table>
- TanStack Table column definitions: <https://tanstack.com/table/latest/docs/guide/column-defs>

## Evidências extraídas

`tab_captura` representa leituras de placas por câmera, com:

- identificador da captura: `seq_captura`;
- placa capturada: `num_placa`;
- metadados visuais opcionais: `des_marca`, `des_cor`;
- entrada e saída separadas em data/hora: `dta_entrada`, `hra_entrada`, `dta_saida`, `hra_saida`;
- timestamps gerados: `ts_entrada`, `ts_saida`;
- vínculo opcional com cadastro de placa: `seq_placa`;
- vínculo opcional com unidade: `seq_unidade`;
- status operacional: `ind_status`;
- câmera: `des_camera`, `des_tipo_camera`, `camera_ip`;
- imagem e recorte de placa: `imagem_path`, `placa_path`, `storage_url`, `storage_placa_url`;
- confiança da leitura OCR/LPR: `confianca`.

Os índices existentes indicam consultas esperadas por:

- placa normalizada;
- unidade;
- placa cadastrada;
- data de entrada;
- veículos abertos no pátio, principalmente `dta_saida is null`;
- entradas abertas por placa/unidade;
- timeline por `ts_entrada desc`.

Os triggers indicam que a tabela não é só histórica. Ela participa de processamento operacional:

- auditoria;
- bloqueio de hard delete;
- redirecionamento de unidade;
- processamento de saída por insert;
- processamento de saída por update;
- atualização de datas de alteração.

## Achados críticos

1. `ts_entrada` e `ts_saida` são colunas geradas.

   Pela documentação oficial do PostgreSQL, colunas `GENERATED ALWAYS AS ... STORED` são calculadas pelo banco e não devem receber valor direto em `INSERT`/`UPDATE`, exceto via `DEFAULT`. O anexo inclui um `INSERT` que informa `ts_entrada` e `ts_saida`. Isso sugere uma destas hipóteses:

   - o `INSERT` é exportação ilustrativa e não script executável;
   - o banco real não está exatamente com esse DDL;
   - a extração veio de uma ferramenta que serializa colunas geradas mesmo sem pretender reaplicar o insert.

   Decisão: a API futura deve tratar `ts_entrada` e `ts_saida` como leitura canônica, mas não deve tentar gravar nessas colunas.

2. Há evidência de duração negativa.

   No exemplo `seq_captura = 3434`, `ts_saida` aparece antes de `ts_entrada`. Isso impede usar permanência de forma ingênua.

   Decisão: qualquer relatório de permanência precisa classificar registros com `ts_saida < ts_entrada` como divergência operacional, não como permanência válida.

3. `dta_saida is null` é o sinal mais forte de veículo aberto no pátio.

   Há índices parciais específicos para `dta_saida is null`, inclusive combinados com `ind_status = true`.

   Decisão: dashboard de ocupação e pátio atual deve usar registros abertos como fonte primária, preferindo o predicado `dta_saida is null and ind_status is true` quando a regra de negócio confirmar que `ind_status` representa captura ativa.

4. `seq_placa` e `seq_unidade` podem ser nulos.

   As FKs usam `on delete set null` e o exemplo real tem `seq_placa = null`.

   Decisão: relatórios não podem depender de cliente/veículo cadastrado para listar captura. Dados cadastrais devem aparecer só quando houver vínculo confiável.

5. `des_tipo_camera` tem domínio parcial e `not valid`.

   O check aceita `entrada` e `saida`, mas está `not VALID`, então dados legados fora do domínio podem existir.

   Decisão: UI deve exibir `Entrada`, `Saída` e fallback operacional neutro como `Tipo não informado`, sem mostrar valor bruto inválido ao usuário.

6. `camera_ip` e URLs brutas são dados técnicos/sensíveis.

   `camera_ip` expõe infraestrutura. `storage_url` pode expor caminho e bucket de imagens contendo veículo/placa.

   Decisão: não exibir IP de câmera na listagem padrão. Imagem deve ser restrita a detalhe autorizado e, se possível, servida por URL controlada/signed/proxy, não como texto técnico.

## Modelo de dashboard recomendado

O dashboard deve ser uma visão de operação atual por unidade, com bento grid e gráficos pequenos, evitando virar uma página de auditoria detalhada.

### Cards principais

1. Veículos no pátio

   Fonte: contagem de capturas abertas por unidade.

   Relevância: é o indicador operacional mais direto para equipe de pátio e bate com os índices `idx_captura_unidade_no_patio`, `idx_captura_unidade_entrada_status` e `idx_captura_placa_norm_aberta`.

2. Ocupação de vagas

   Fonte: veículos abertos dividido pela capacidade configurada da unidade.

   Visual: radial chart.

   Relevância: transforma captura bruta em risco de capacidade. O radial combina com a recomendação já aplicada no projeto para vagas, desde que `ChartContainer` tenha altura fixa/minima conforme shadcn/ui.

3. Entradas e saídas no período

   Fonte: agrupamento por `ts_entrada`/`ts_saida` e `des_tipo_camera`.

   Visual: bar chart empilhado ou agrupado por hora.

   Relevância: mostra fluxo operacional sem precisar abrir tabela. Deve tolerar registros sem saída.

4. Confiança média das leituras

   Fonte: `confianca`.

   Visual: número + lista curta por câmera ou bar chart por câmera.

   Relevância: confiança baixa afeta pareamento, cobrança, fiscalização e suporte. O exemplo real tem confiança `46.00`, então o caso existe e deve ser visível.

5. Divergências operacionais

   Fonte: regras derivadas:

   - saída antes da entrada;
   - captura aberta há tempo excessivo;
   - tipo de câmera ausente/inválido;
   - unidade ausente;
   - placa sem vínculo cadastral quando o relatório exigir cadastro.

   Relevância: evita que o dashboard mostre números limpos quando a base tem inconsistência operacional.

### Gráficos recomendados

1. Radial: ocupação de vagas.

   Justificativa: percentual sobre capacidade tem domínio fixo 0-100 e é adequado para radial.

2. Barras: entradas e saídas por hora.

   Justificativa: a operação é temporal e comparativa. Barras permitem leitura rápida por horário.

3. Donut/pie: status das capturas recentes.

   Status proposto:

   - `No pátio`;
   - `Saída registrada`;
   - `Divergente`;
   - `Tipo não informado`.

   Justificativa: útil para distribuição de estado, não para série temporal.

4. Barras horizontais: leituras por câmera.

   Justificativa: identifica concentração de eventos ou câmera ruidosa sem exigir tabela.

5. Área/linha: evolução da ocupação.

   Justificativa: útil quando a API entregar série agregada por intervalo. Não deve ser simulada como dado oficial em produção sem fonte agregada validada.

## Abas de relatórios recomendadas

### 1. Movimentações

Tabela principal de eventos/capturas.

Colunas:

- Data/hora;
- Placa;
- Tipo;
- Câmera;
- Unidade;
- Confiança;
- Status;
- Vínculo cadastral;
- Ações.

Filtros:

- Unidade;
- Período;
- Tipo de câmera;
- Status;
- Câmera;
- Faixa de confiança;
- Placa.

Justificativa: é a visão mais próxima da fonte `tab_captura` e serve para conferência operacional, suporte e auditoria de leituras.

### 2. Pátio atual

Lista somente registros abertos.

Critério inicial:

- `dta_saida is null`;
- preferencialmente `ind_status is true`, após validação da semântica real.

Colunas:

- Placa;
- Entrada;
- Tempo no pátio;
- Câmera de entrada;
- Confiança;
- Unidade;
- Imagem disponível;
- Ações.

Justificativa: esta aba é a ponte direta com o pátio virtual. O usuário precisa ver o que está aberto agora, não só histórico.

### 3. Permanência

Tabela analítica de entradas com saída válida.

Critério:

- `ts_entrada is not null`;
- `ts_saida is not null`;
- `ts_saida >= ts_entrada`.

Colunas:

- Placa;
- Entrada;
- Saída;
- Permanência;
- Unidade;
- Câmera de entrada;
- Câmera de saída, se disponível;
- Confiança.

Justificativa: tempo de permanência alimenta operação, regra comercial e análise de gargalos. Registros negativos ou incompletos devem ir para divergências.

### 4. Qualidade das leituras

Tabela e gráficos focados em LPR/OCR.

Colunas:

- Data/hora;
- Placa;
- Confiança;
- Câmera;
- Tipo;
- Imagem disponível;
- Status da leitura.

Filtros:

- Período;
- Câmera;
- Tipo;
- Faixa de confiança;
- Unidade.

Justificativa: o exemplo real traz confiança baixa. Sem esta visão, falhas de leitura viram erro silencioso em relatórios operacionais.

### 5. Divergências

Fila de dados que precisam de atenção.

Categorias:

- Saída antes da entrada;
- Captura aberta antiga;
- Tipo de câmera inválido ou ausente;
- Unidade ausente;
- Placa sem vínculo cadastral;
- URL/imagem ausente quando esperada;
- Duplicidade aberta por placa normalizada e unidade.

Justificativa: separa problemas de qualidade da operação normal e evita contaminar KPIs.

### 6. Faturamento

Não deve ser derivado apenas de `tab_captura`.

Critério para habilitar:

- existir contrato validado com sessões/cobranças/preços/regras;
- existir vínculo entre captura, permanência e valor cobrado.

Justificativa: `tab_captura` informa movimento, não cobrança. Mostrar receita apenas por captura criaria dado não suportado.

## Estratégia de mocks realistas

Mocks devem simular o ambiente real sem fingir produção.

### Regras

- Manter shape próximo ao payload da API futura.
- Preservar casos anômalos do exemplo real.
- Não mascarar falhas de dado que o banco pode retornar.
- Em produção, continuar falhando sem fonte real, como já ocorre nos services atuais.

### Casos obrigatórios no dataset mockado

1. Entrada aberta válida

Base no exemplo:

- placa `QJT4188`;
- tipo `entrada`;
- `ts_saida = null`;
- confiança `74.00`;
- status `No pátio`.

1. Saída com divergência temporal

Base no exemplo:

- placa `FCM5673`;
- tipo `saida`;
- `ts_saida < ts_entrada`;
- confiança `46.00`;
- status `Divergente`.

1. Captura sem placa cadastrada

Base no fato de `seq_placa` ser opcional.

1. Captura com tipo ausente ou inválido

Base no check `not VALID`.

1. Captura sem imagem pública

Base nos campos `placa_path` e `storage_placa_url` nulos.

1. Múltiplas capturas por unidade e horário

Necessário para validar charts de barras e filtros.

## Contratos de dados sugeridos

### Captura normalizada

```ts
type CaptureCameraType = "entrada" | "saida" | "unknown"
type CaptureOperationalStatus =
  | "in_yard"
  | "closed"
  | "inconsistent"
  | "unlinked"

interface CaptureEvent {
  id: string
  sequence: number
  plate: string
  normalizedPlate: string
  brand: string | null
  color: string | null
  unitId: string | null
  plateRecordId: string | null
  cameraName: string | null
  cameraType: CaptureCameraType
  capturedAt: string
  exitedAt: string | null
  stayMinutes: number | null
  confidence: number | null
  status: CaptureOperationalStatus
  hasVehicleImage: boolean
  hasPlateImage: boolean
}
```

### Agregados de dashboard

```ts
interface CaptureDashboardSnapshot {
  unitId: string
  period: {
    from: string
    to: string
  }
  capacity: {
    total: number
    occupied: number
    available: number
    occupancyPercent: number
  }
  flowByHour: Array<{
    hour: string
    entries: number
    exits: number
  }>
  confidenceByCamera: Array<{
    cameraName: string
    averageConfidence: number
    reads: number
  }>
  statusDistribution: Array<{
    status: CaptureOperationalStatus
    count: number
  }>
  recentMovements: CaptureEvent[]
  divergences: CaptureEvent[]
}
```

## Decisões de UI

1. Usar componentes já existentes.

   Tabelas devem continuar usando `DataTable` compartilhado. Gráficos devem continuar usando `ChartContainer`, `ChartTooltip` e `ChartLegend` do shadcn/ui sobre Recharts.

2. Abas devem separar intenção, não origem técnica.

   O usuário não deve ver uma aba chamada `tab_captura`. O nome da tabela é detalhe de integração. As abas devem ser `Movimentações`, `Pátio atual`, `Permanência`, `Qualidade`, `Divergências` e `Faturamento` apenas quando suportado.

3. Dados técnicos devem ficar fora da listagem padrão.

   `camera_ip`, paths de storage, hashes e detalhes de trigger não devem aparecer como texto para usuário final.

4. Toda coluna principal deve abrir detalhe.

   Nas tabelas de captura, a coluna `Placa` deve abrir `AppDetailsSheet` com os campos autorizados e, futuramente, preview controlado de imagem.

5. Badges devem ser sem ordenação visual no header.

   Status, tipo de câmera, vínculo e severidade devem seguir o padrão já aplicado nas tabelas: título centralizado, badge centralizado, sem ícone de ordenação quando a coluna for categórica de exibição.

6. Filtros devem usar contagem.

   Para câmera, tipo, status, unidade e confiança, os filtros devem exibir quantidade de itens por opção quando a tabela estiver carregada.

## Riscos e pendências antes de implementar

1. Confirmar DDL real.

   O `INSERT` com colunas geradas é incompatível com o DDL anexado. Antes de qualquer migration/API, confirmar no banco real com introspecção.

2. Confirmar semântica de `ind_status`.

   A hipótese atual é que `true` representa captura aberta/ativa e `false` representa saída/processada, mas isso deve ser validado com exemplos adicionais e funções `fn_processar_saida_*`.

3. Confirmar capacidade de vagas por unidade.

   A ocupação exige capacidade configurada. `tab_captura` não contém capacidade. O dashboard precisa combinar com a configuração de pátio já existente no projeto.

4. Confirmar regra de pareamento.

   Há índices e triggers de pareamento, mas a UI não deve reimplementar pareamento no frontend. O backend deve entregar `stayMinutes` e status normalizado.

5. Confirmar política de imagem.

   O app deve decidir se imagens LPR são visíveis no detalhe, se precisam de URL assinada, e quais perfis podem acessar.

6. Confirmar timezone.

   O DDL usa offset fixo `-03:00`. Isso pode ser suficiente para operação local, mas deve ser documentado como decisão de backend. Frontend deve consumir timestamps ISO normalizados.

## Próximo passo recomendado

Antes de implementar UI:

1. Criar uma consulta/API somente leitura que normalize `tab_captura` para `CaptureEvent`.
2. Criar mocks com os casos obrigatórios listados.
3. Atualizar contratos de `dashboard` e `reports` para usar o mesmo modelo normalizado.
4. Só então refatorar tabs, tabelas e gráficos.
