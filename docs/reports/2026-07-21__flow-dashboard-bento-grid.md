# Dashboard Bento Grid

## Fluxo

Dashboard operacional por unidade selecionada.

## Objetivo

Refatorar o dashboard para uma composição em bento grid com cards, listas, tabela e gráficos shadcn/ui/Recharts, mantendo responsividade e sem criar filtros ou dados que a rota não suporta.

## Levantamento forense

- `DashboardRoute` carrega `DashboardDataSnapshot` por `useDashboardSnapshot`.
- O snapshot atual possui capacidade do pátio, indicadores, série de ocupação por hora, série de receita por dia, movimentações recentes, registros de faturamento e alertas.
- A seleção de unidade já é o filtro real da rota via `AppUnitSelector`.
- Não existe contrato de backend para filtro global de data, segmento, câmera ou status nesta rota.
- Em produção, `dashboard-service` falha quando não há fonte operacional configurada, evitando exibir mock como dado oficial.

## Correções aplicadas

- Criado `DashboardBentoGrid` como composição única da feature.
- Radial chart exibe vagas ocupadas, vagas disponíveis e percentual de ocupação.
- Bar chart alterna entre movimentação e receita usando apenas séries já presentes no snapshot.
- Donut chart resume status das movimentações recentes.
- Cards de indicadores, resultado monitorado e balanço de fluxo exibem valores legíveis e textos operacionais.
- Tabela de movimentações usa `DataTable` com `surface="plain"` e sem bloco de filtros quando não há controles reais.
- Alertas foram mantidos como lista clicável com severidade e data curta.

## Limites respeitados

- Nenhuma migration foi criada para esta refatoração.
- Nenhum filtro global sem suporte foi adicionado.
- Nenhum dado técnico, payload bruto ou regra operacional nova foi exposto ao usuário.
- Os gráficos derivam dos campos já presentes em `DashboardDataSnapshot`.

## Validação

- `pnpm test -- tests/features/dashboard/dashboard-bento-grid.test.tsx`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm validate`
- `pnpm test`
- `pnpm build`

## Resultado

Validação aprovada em 2026-07-21:

- Lint sem erros.
- Typecheck da aplicação e dos testes sem erros.
- Validação de pacote aprovada com 776 arquivos, 498 arquivos de código em `src` e 47 migrations.
- Suíte completa Vitest aprovada com 42 arquivos e 159 testes.
- Build de produção concluído com chunk `charts-vendor` dedicado; permanecem apenas avisos conhecidos de import dinâmico nas rotas de auth.
