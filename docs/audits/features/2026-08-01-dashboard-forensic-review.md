# Auditoria forense — `src/features/dashboard`

Data: 2026-08-01
Estado: auditoria concluída; preview de desenvolvimento, não capability produtiva
Escopo: 16 arquivos, 2 testes, lazy loader/registry e dependência de configuração de pátio

## Conclusão

Dashboard usa exclusivamente fixtures de desenvolvimento e lança erro em `PROD`. O router também escolhe `production-home-route` e não importa o Dashboard no build produtivo; o build atual confirma ausência de chunk `dashboard`. Isso impede que números sintéticos sejam apresentados como reais em produção.

O preview ainda requer refatoração: um componente concentra mais de 700 linhas, copy e formatadores; o hook tem corridas entre troca de unidade, carga automática e retry; e o cálculo de capacidade mascara overcapacity ao elevar a capacidade configurada para o número ocupado. Sem read model operacional real, a feature deve continuar development-only e não receber adapter falso.

## Achados

| ID | Severidade | Achado | Ação |
| --- | --- | --- | --- |
| DB-01 | Alta | Resposta de retry pode sobrescrever a unidade corrente; não há generation guard/abort compartilhado. | Reescrever o hook com request key, geração e cancelamento; testar troca/refetch fora de ordem. |
| DB-02 | Alta | `getDashboardCapacitySummary` usa `max(configured, occupied)`, ocultando ocupação acima da capacidade. | Preservar capacidade configurada, calcular overcapacity explicitamente e limitar apenas a visualização do gráfico. |
| DB-03 | Alta | Feature não possui fonte operacional real. | Permanecer excluída de produção; só ativar após gateway/schema/RLS/read model autorizado e testes reais. |
| DB-04 | Média | `dashboard-bento-grid.tsx` concentra oito cards, gráficos, formatadores, copy e limites. | Separar cards por responsabilidade e manter uma composição fina; sem wrappers vazios por entidade. |
| DB-05 | Média | Grande volume de texto hardcoded em componentes, detalhes e colunas. | Consolidar copy/labels/formatters tipados. |
| DB-06 | Média | Fixtures com datas/PII simulada vivem em `model` e dependem de uma única unidade. | Renomear para preview fixture, deixar gate explícito e excluir de qualquer entry produtivo por teste de bundle. |
| DB-07 | Média | Gráficos têm `role=img`, mas não oferecem equivalente textual completo para séries. | Incluir resumo/tabela acessível e testar teclado/zoom/contraste. |
| DB-08 | Média | `stayMinutes` usa truthiness; zero vira indisponível. Datas inválidas exibem `Invalid Date`. | Usar nullish check e formatadores defensivos compartilhados. |
| DB-09 | Baixa | Barrels internos e arquivos de colunas não usados pelo grid ampliam superfície. | Confirmar consumidores; remover `dashboard-alerts-columns`/`dashboard-billing-columns` se continuarem mortos e eliminar barrels. |
| DB-10 | Baixa | `space-y-4` diverge da regra de layout por `gap-*`; ícones/media têm composição inconsistente. | Aplicar padrão shadcn fora de `components/ui`. |

## Segurança e dados

O preview não chama tabelas operacionais, exceto leitura real de `unit_yard_configs`. Não há SQL dinâmico ou HTML inseguro. Placas, câmeras, faturamento e alertas são fixtures; o risco é semântico: aparentarem dados reais. O gate duplo service/router deve ser preservado e testado. Quando houver backend, placa/câmera/faturamento exigirão minimização, RLS por unidade, retenção, auditoria de acesso e agregações no servidor.

## Performance

Recharts é carregado apenas no caminho de desenvolvimento e não consta no bundle produtivo atual do Dashboard. O grid memoiza séries/colunas pequenas. A implementação real não deve baixar eventos para agregar no browser: ocupação, receita, fluxo e alertas devem vir de endpoint/read model agregado, com intervalo e unidade autorizados, cache invalidável e limites.

## Matriz por arquivo

| Arquivo | Responsabilidade | Revisão/ação |
| --- | --- | --- |
| `components/dashboard-bento-grid.tsx` | Oito cards e gráficos | Grande demais, copy hardcoded e acessibilidade de chart incompleta. Decompor. |
| `components/index.ts` | Barrel | Remover; importar componente diretamente. |
| `constants/dashboard-copy.ts` | Copy | Incompleto; quase todo texto está no JSX. Completar. |
| `docs/README.md` | Contrato | Declara corretamente mock/dev-only; detalhar exclusão do bundle e critérios de ativação. |
| `docs/VALIDATION.md` | Checklist | Superficial; incluir bundle, corrida, overcapacity e a11y. |
| `hooks/use-dashboard-snapshot.ts` | Unidade/load/retry | Corrida, strings hardcoded, sem abort. Refatorar. |
| `model/dashboard-analytics.ts` | Agregações puras | Boa separação, mas capacidade mascara overcapacity. Corrigir/testar limites. |
| `model/dashboard-details.ts` | Presenter | Copy/formatadores duplicados; `stayMinutes=0` incorreto. Consolidar. |
| `model/dashboard-mock-data.ts` | Fixture preview | Não é modelo. Mover/renomear e garantir exclusão produtiva. |
| `model/dashboard-types.ts` | Contrato de snapshot | Adequado ao preview; futuro wire deve ficar em schema separado. |
| `routes/dashboard-route.tsx` | Página/erro/detalhes | Copy hardcoded; alteração local do ícone deve ser preservada. Afinar após controller. |
| `services/dashboard-service.ts` | Fixture + yard real | Mistura dado fake e real. Manter apenas em adapter preview explicitamente gated. |
| `table/dashboard-alerts-columns.tsx` | Colunas de alertas | Sem consumidor atual. Remover ou adotar; não manter dormente. |
| `table/dashboard-billing-columns.tsx` | Colunas de faturamento | Sem consumidor atual. Remover ou adotar. |
| `table/dashboard-movements-columns.tsx` | Colunas usadas | Hardcoded e formatação defensiva incompleta. Centralizar. |
| `table/index.ts` | Barrel | Exporta também coluna morta. Remover. |

## Testes

| Arquivo | Avaliação |
| --- | --- |
| `dashboard-service.test.ts` | Cobre capacidade e unidade ausente em DEV; não cobre PROD, config ausente/erro/overcapacity. |
| `dashboard-bento-grid.test.tsx` | Cobre blocos, detalhes, Select e agregações; falta chart a11y, vazio, responsivo e valores inválidos. |

Faltam testes do hook/rota, troca de unidade fora de ordem e inspeção do manifest/bundle produtivo. A implementação final deve provar que mocks e Recharts específicos do Dashboard não são alcançáveis na build de produção enquanto a capability estiver indisponível.

## Critérios de aceite

- Produção não registra/importa Dashboard nem inclui fixtures/chunk.
- Preview exibe rótulo inequívoco de dados demonstrativos.
- Troca de unidade/refetch não aceita resposta obsoleta e cancela requests.
- Overcapacity é representada, não escondida.
- Cards ficam em arquivos de responsabilidade clara; copy e formatters são únicos.
- Gráficos possuem alternativa textual e passam teclado, zoom e leitor de tela.
- Ativação produtiva só ocorre com schema/gateway/read model/RLS/testes reais aprovados.
