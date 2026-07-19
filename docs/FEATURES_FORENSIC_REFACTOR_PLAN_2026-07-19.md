# Plano Forense de Refatoracao - Features

Data da revisao: 2026-07-19

## Objetivo

Padronizar layout, contratos de dados, validacao, tratamento de erro e fluxo de tabela nas features, reduzindo duplicacao e risco de regressao.

## Escopo auditado

- Diretoriios em `src/features/*`.
- Rotas com `DataTable`, filtros, paginacao, `AppDetailsSheet`, dialogs e fluxos de sync.
- Validacoes em `model/*-validation.ts`.
- Servicos com Supabase RPC e Edge Functions.

## Levantamento forense dos componentes reutilizados

### Uso consolidado encontrado

- `DataTable`: amplamente usado nas features de usuarios, unidades, clientes, regras, precos, permissoes, notificacoes, auditoria e solicitacoes.
- `PageHeader`, `PageSection`, `PageHeaderActions`: base visual comum da maioria das rotas autenticadas.
- `AppDetailsSheet`: padrao transversal de detalhe de registro.
- `AppEmptyState`: estado vazio/filtrado sem resultados em quase todas as tabelas.

### Diagnostico

- A base de componentes compartilhados esta correta e reutilizavel.
- O problema principal esta no codigo periferico das features (normalizacao, tratamento de erro, nomenclatura e contratos legados), nao nos componentes base.

## Achados criticos (priorizados)

### P0 - Contrato de dominio contaminado por legado

- `rules` e `prices` possuem adaptacoes legadas dentro de validacao e hooks, com campos paralelos (`ruleType`, `network`, `appliesToAllVehicles`) e casts de compatibilidade.
- Evidencias:
  - `src/features/rules/model/rules-validation.ts`
  - `src/features/rules/hooks/use-rules.ts`
  - `src/features/prices/model/prices-validation.ts`
  - `src/features/prices/hooks/use-prices.ts`

Risco: baixa previsibilidade de contrato, maior chance de bug silencioso e dificuldade de manutencao.

### P0 - Risco de privacidade (CPF)

- Mapeamento de usuarios ainda aceita `cpf_display` antes de `cpf_masked`.
- Evidencia:
  - `src/features/users/services/users-service.ts`

Risco: CPF completo pode permanecer em memoria/UI, violando regra de negocio e LGPD.

### P1 - Servico de compatibilidade sem efeito real

- `updatePriceTableStatus` em compat service e no-op.
- Evidencia:
  - `src/features/prices/services/prices-compat-service.ts`

Risco: comportamento inesperado e contratos ambiguos em chamadas futuras.

### P1 - Tratamento de erro heterogeneo

- Padroes diferentes de sanitizacao e fallback de erro por feature.
- Evidencias:
  - `src/features/auth/routes/auth-login-route.tsx`
  - `src/features/clients/routes/clients-route.tsx`
  - `src/features/units/routes/units-route.tsx`
  - `src/features/notifications/routes/notifications-route.tsx`

Risco: UX inconsistente e exposicao de mensagens tecnicas.

### P1 - Duplicacao de fluxo de sync

- `clients` e `units` repetem logica de start sync, refresh, fallback de erro e mensagem.
- Evidencias:
  - `src/features/clients/routes/clients-route.tsx`
  - `src/features/units/routes/units-route.tsx`

Risco: drift funcional e manutencao custosa.

### P2 - Inconsistencia de padrao de import/layout

- `yard-route` importava `PageHeader` e `PageSection` por caminho direto de arquivo.
- Evidencia:
  - `src/features/yard/routes/yard-route.tsx`

Risco: drift de padrao e maior atrito em refatoracoes globais.

## Plano de execucao

## Fase 0 - Baseline e seguranca (P0)

Entregas:

1. Bloquear propagacao de CPF nao mascarado no mapeamento de usuarios.
2. Definir contrato unico de payload para regras/precos no frontend (sem campos legados na camada de UI).
3. Isolar adaptacao legada em adapters explicitos de compatibilidade.

Criterios de aceite:

- Nenhum campo legado aparece em tipos de formulario/route.
- `users-service` garante valor mascarado para CPF em qualquer origem.
- Testes de contrato para payload de regras/precos.

## Fase 1 - Padronizacao transversal de tabela e erro (P1)

Entregas:

1. Factory/hook comum para `globalSearch`, `filterFields` e persistencia de estado de tabela.
2. Contrato unico de erro visual para features (`sanitize + fallback copy`).
3. Alinhar `onRetry`, `emptyState` e `filteredEmptyState` para todas as rotas de tabela.

Criterios de aceite:

- Rotas de tabela usam o mesmo padrao de composicao.
- Erros de usuario exibidos em formato consistente.
- Lint sem novos avisos no escopo de features migradas.

## Fase 2 - Consolidacao de fluxos duplicados (P1)

Entregas:

1. Extrair fluxo comum de sincronizacao (`start`, `refresh`, `inProgress`, `failed`, `success`).
2. Remover duplicacao de blocos clients/units para sync e historico.
3. Padronizar callbacks assíncronos e notificacao final.

Criterios de aceite:

- Reducao mensuravel de codigo duplicado nas rotas de sync.
- Comportamento identico entre clients e units em cenarios de erro e warning.

## Fase 3 - Nomenclatura e organizacao (P2)

Entregas:

1. Convencao unificada de pastas/arquivos em `model` (`types`, `normalization`, `validation`, `formatting`, `details`).
2. Revisao de imports por barrel para componentes e features.
3. Limpeza de aliases e nomenclaturas redundantes.

Criterios de aceite:

- Estrutura de model previsivel em todas as features principais.
- Sem imports por caminho interno quando houver barrel oficial.

## Matriz de padronizacao obrigatoria

### Tabelas e filtros

- `DataTable` com `enablePagination` e `enableViewOptions` para listas equivalentes.
- `globalSearch` e `filterFields` definidos por helper comum.
- Estados `emptyState` e `filteredEmptyState` sempre presentes em listas de negocio.

### Sheets de detalhes

- `AppDetailsSheet` como padrao unico.
- Estrutura de itens (`label`, `value`) sem logica de dominio na camada de apresentacao.

### Validacao

- `safeParse` como fluxo padrao para formularios.
- retorno uniforme (`success`, `data`, `errors`) sem cast de compatibilidade no final.

### Erros e notificacoes

- Mensagem tecnica nao deve ser exibida ao usuario final.
- Feedback de sucesso/erro final via `notify` com copy de dominio.

## Criticos de performance

- Evitar estados derivados e efeitos desnecessarios para recalculos simples.
- Priorizar memoizacao de filtros/opcoes apenas quando houver custo real.
- Evitar duplicacao de requests concorrentes em fluxos de sync.

## Criticos de seguranca

- Nao trafegar CPF completo para UI/estado/URL.
- Garantir chamadas administrativas com permissao efetiva e fallback seguro.
- Sanitizar mensagens de erro vindas de backend.

## Referencias de boas praticas

- React: `You Might Not Need an Effect`.
- TanStack Table: guias oficiais de global/column filtering e estado controlado.
- Zod: `safeParse` com tratamento discriminado de erro.
- Supabase: arquitetura de auth e boas praticas para funcoes/RPC.

## Resultado esperado

Ao final das fases P0/P1/P2, as features devem compartilhar layout e comportamento equivalentes para componentes iguais, com contratos previsiveis, menor duplicacao, maior seguranca de dados sensiveis e menor risco de regressao.
