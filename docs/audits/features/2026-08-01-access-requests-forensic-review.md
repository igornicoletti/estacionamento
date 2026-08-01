# Auditoria forense — `src/features/access-requests`

Data: 2026-08-01
Estado: auditoria concluída; correções ainda não aplicadas nesta etapa
Escopo: 20 arquivos da feature, 2 arquivos de teste, registro de rotas, consumidor em `users`, RLS e Edge Function relacionados

## Resumo executivo

A feature usa dados reais do Supabase, restringe leitura por RLS e delega a mutação privilegiada à Edge Function `admin-recovery-review`. React mantém escaping padrão, o query builder evita concatenação SQL e a senha temporária é validada no frontend e novamente no backend. O baseline passa em ESLint, TypeScript, 281 testes e build.

O principal achado é de autorização de interface: `UsersRoute` concede acesso à aba com `access_requests.read`, mas instancia `AccessRequestsPanel` sem informar `canReview`; o valor padrão `true` expõe Aprovar/Negar para leitores sem `access_requests.review`. A Edge Function impede a operação, portanto não há escalada de privilégio no backend, mas há violação de least privilege, UX enganosa e tráfego negado evitável.

Também permanecem responsabilidades de gateway e parsing dentro de `services`/`model`, strings fora de `constants`, barrels internos excessivos, cobertura insuficiente de falhas e risco de estado parcial no fluxo remoto que altera Auth e tabelas em operações separadas.

## Fluxo e controles verificados

1. A rota `/solicitacoes-acesso` exige `access_requests.read` e redireciona para `/usuarios?tab=solicitacoes`.
2. `UsersRoute` mostra a aba apenas quando o ator possui `access_requests.read`.
3. O hook carrega solicitações pendentes por `access_recovery_requests`; a policy vigente usa `private.has_current_user_permission('access_requests.read')`.
4. Aprovação/negação chama `admin-recovery-review` com sessão Supabase.
5. A função exige usuário ativo e `access_requests.review`, valida método, JSON, decisão, identificador e senha.
6. A função grava `audit_events`, mas a alteração de senha no Auth, o estado de `app_users` e a revisão da solicitação não são uma transação única. Uma falha intermediária pode deixar resultado parcial.

## Achados priorizados

| ID | Severidade | Achado | Evidência | Refatoração exigida |
| --- | --- | --- | --- | --- |
| AR-01 | Alta | Ações administrativas são visíveis para quem possui apenas leitura. | `AccessRequestsPanel` usa `canReview=true`; `UsersRoute` não passa `access_requests.review`. | Remover o default permissivo, calcular a capability no consumidor e testar leitor, revisor e resposta 403. |
| AR-02 | Alta | Aprovação pode produzir estado parcial entre Auth, `app_users` e `access_recovery_requests`. | `admin-recovery-review` altera os três recursos sequencialmente. | Modelar etapas/compensação, registrar falhas auditáveis e adicionar testes negativos de cada ponto de falha e idempotência. |
| AR-03 | Média | O contrato externo é normalizado manualmente e registros inválidos são descartados silenciosamente. | `access-requests-normalization.ts` retorna `null` por linha e o array reduz sem telemetria. | Criar `schemas/access-recovery-request-schema.ts`, gateway explícito e erro estruturado/contagem redigida de linhas inválidas. |
| AR-04 | Média | A camada `services` mistura I/O Supabase, seleção SQL e caso de uso. | `access-requests-service.ts`. | Introduzir `gateways/` com contrato e adapter Supabase; manter o serviço como orquestração injetável. |
| AR-05 | Média | Cobertura não valida leitura, RLS/capabilities, erro remoto, payload inválido, negação e repetição concorrente. | Apenas um teste unitário do service e quatro cenários principais da rota. | Acrescentar testes de schema/gateway, hook, autorização visual, erros, resposta fora de ordem e integração local com RLS/Edge. |
| AR-06 | Média | A feature exporta internals e mantém cinco barrels, ampliando a API e dificultando lazy loading. | `index.ts` público exporta service, model e table; barrels internos em quatro subpastas. | Manter um índice público estreito apenas para `AccessRequestsPanel`; usar imports diretos internamente. |
| AR-07 | Baixa | Textos e chave de cache permanecem hardcoded fora de `constants`. | Títulos de detalhes e `access-requests:list:v2`. | Centralizar copy e identificadores estáveis com nomes de responsabilidade. |
| AR-08 | Baixa | A rota concentra tabela, estado de detalhes e dois fluxos de confirmação. | `access-requests-route.tsx` tem aproximadamente 290 linhas. | Extrair controller/hook de revisão e composição dos dialogs sem criar wrappers meramente cosméticos. |
| AR-09 | Baixa | Erros do Supabase perdem causa/código/correlation id. | O service lança mensagens genéricas. | Mapear erro técnico para log redigido e erro de domínio seguro; nunca expor PII ou senha. |

## Segurança

- SQL injection: não foi encontrada concatenação; filtros usam PostgREST com valores parametrizados.
- XSS: textos são renderizados por React, sem `dangerouslySetInnerHTML`; descrição externa continua como texto.
- CSRF: mutação usa bearer token Supabase e POST; a proteção efetiva depende de validação do JWT/origem na Edge Function. Não há autenticação por cookie nesta chamada.
- PII: telefone é normalizado e mascarado na tabela, mas e-mail, nome e detalhes continuam sensíveis e dependem integralmente de RLS. `cpf_hmac` não é selecionado pelo browser.
- Segredos: a senha temporária fica apenas no estado do componente e no corpo HTTPS; não deve aparecer em logs, auditoria, toast ou fixtures persistentes.
- Autorização: backend correto para `access_requests.review`; frontend deve refletir a mesma capability.
- Rastreabilidade: a função grava evento de auditoria; falhas de auditoria são atualmente toleradas e apenas logadas, devendo haver alerta operacional redigido.

## Desempenho e escalabilidade

A consulta carrega todas as solicitações pendentes e filtra/pagina no cliente. É aceitável apenas enquanto o volume pendente for comprovadamente baixo. O contrato deve evoluir para paginação e filtros server-side, com limite explícito, total autorizado e cancelamento. O hook compartilhado protege snapshots, mas o gateway não recebe `AbortSignal`; respostas obsoletas precisam de teste de geração e cancelamento.

## Acessibilidade e UX

Os dialogs têm títulos/descrições, a ação destrutiva exige confirmação, a senha usa o campo compartilhado e estados de vazio/filtrado/erro/loading são fornecidos à DataTable. Faltam testes de foco devolvido ao gatilho, Escape, navegação por teclado nos filtros/ações, anúncio do erro de senha e viewports estreitos. Ações sem permissão não devem ser apenas desabilitadas: devem ser omitidas.

## Matriz por arquivo

| Arquivo | Responsabilidade | Estado/achado | Ação planejada |
| --- | --- | --- | --- |
| `index.ts` | API pública | API ampla demais. | Exportar somente o painel/contrato necessário ao consumidor. |
| `constants/access-requests-copy.ts` | Copy e labels | Bem tipado; linhas longas e textos de detalhes ainda fora dele. | Completar copy e preservar tipos por `RecoveryReason`. |
| `constants/access-requests-persistence.ts` | Chave da tabela | Adequado. | Manter; documentar versão quando o shape mudar. |
| `constants/index.ts` | Barrel interno | Redundante. | Remover e importar arquivos diretamente. |
| `docs/README.md` | Contrato da feature | Útil, mas não descreve capability de revisão separada nem estado parcial. | Atualizar após implementação. |
| `docs/VALIDATION.md` | Checklist | Manual e sem comandos focados/RLS. | Adicionar testes automatizados, Edge e RLS. |
| `hooks/index.ts` | Barrel interno | Redundante. | Remover. |
| `hooks/use-access-requests.ts` | Snapshot e revisão | Mistura load e mutação; não recebe gateway; chave hardcoded. | Injetar serviço, separar controller de revisão e proteger concorrência/geração. |
| `model/access-requests-details.ts` | Presenter de detalhes | Função pura; duas strings hardcoded. | Mover copy e manter presenter. |
| `model/access-requests-formatters.ts` | Formatação e status | Responsabilidade clara. | Manter; testar combinações tri-state. |
| `model/access-requests-normalization.ts` | Parser manual | Rejeição silenciosa e contrato externo sem Zod. | Substituir por schema + mapper explícito. |
| `model/access-requests-types.ts` | Tipos de domínio | Mistura snapshot/UI target ao domínio. | Separar modelo de domínio de estado de apresentação. |
| `model/index.ts` | Barrel interno | Reexporta quase todo o módulo. | Remover. |
| `routes/access-requests-redirect-route.tsx` | Compatibilidade de URL | Pequeno e correto. | Manter enquanto a URL histórica for suportada e documentar depreciação. |
| `routes/access-requests-route.tsx` | Composição completa | Default permissivo e tamanho elevado. | Exigir `canReview`, extrair fluxo de revisão e manter a rota fina. |
| `services/access-requests-service.ts` | I/O e caso de uso | Mistura gateway/parsing; erros genéricos. | Dividir gateway, schema e service injetável. |
| `services/index.ts` | Barrel interno | Redundante e expõe I/O. | Remover. |
| `table/index.ts` | Barrel interno | Redundante. | Remover. |
| `table/recovery-requests-columns.tsx` | Colunas e ações | Boa reutilização; ação depende de `canReview`. | Manter composição e testar ausência das ações. |
| `table/recovery-requests-filter-options.ts` | Opções de motivo | Puro e reutiliza helper compartilhado. | Manter próximo da tabela. |

## Testes e referências relacionadas

| Arquivo externo | Cobertura/achado |
| --- | --- |
| `tests/features/access-requests/access-requests-route.test.tsx` | Cobre render, filtro, aprovação, negação e redirect; falta capability read-only, erro, foco e concorrência. |
| `tests/features/access-requests/access-requests-service.test.ts` | Cobre somente aprovação bem-sucedida; falta listagem, schema, ausência de cliente, erros e negação. |
| `src/features/users/routes/users-route.tsx` | Consumidor que deve passar separadamente `accessRequestsReview`. |
| `src/app/router/route-registry.ts` | Protege leitura da rota; não deve ser usado como autorização da mutação. |
| `supabase/migrations/20260714144247_unify_access_request_permission_policies.sql` | Policy vigente de leitura por capability. |
| `supabase/functions/admin-recovery-review/index.ts` | Validação de mutação, autorização, alteração de Auth/dados e auditoria. |

## Critérios de aceite da implementação

- Usuário com apenas `access_requests.read` consulta dados e não vê ações de revisão.
- Usuário com `access_requests.review` vê e executa as ações; 401/403/404/409/422 são tratados sem falso sucesso.
- Payloads de banco e função são validados por Zod antes de chegar ao domínio.
- Registros inválidos não desaparecem sem sinalização redigida.
- Tentativa repetida é idempotente e falhas intermediárias não deixam solicitação marcada como concluída sem estado coerente.
- Testes focados, RLS local, Deno check, ESLint, ambos os typechecks, suíte e build passam.
- Teclado, foco, nomes acessíveis, vazio, filtrado, erro e loading são validados.
