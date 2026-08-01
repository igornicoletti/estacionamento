# Revisão forense — `src/features/notifications`

Data da revisão: 2026-08-01
Escopo: todos os 23 arquivos da feature, testes diretos, provider autenticado, Sidebar, Security e migrations/RPCs de notificações.
Estado: auditoria concluída; implementação pendente da etapa consolidada.

## Parecer executivo

A feature já usa dados reais, RLS, RPCs restritas e assinatura Realtime filtrada pelo destinatário. O domínio normalizado impede destinos externos e a UI não expõe o identificador técnico no painel de detalhes. Esses são bons fundamentos.

O principal risco de integridade é `createEmptyNotificationsGateway`: quando o cliente Supabase não existe, a aplicação produtiva aparenta ter carregado uma caixa vazia, em vez de declarar indisponibilidade. A lista também é integral, sem limite, cursor ou cancelamento; o provider executa lista e contador em consultas separadas e pode aplicar respostas fora de ordem. Há ainda uma segunda implementação de ícones, contador, recent items e vazio no Sidebar, enquanto componentes/hooks equivalentes desta feature estão mortos. A API pública e os barrels expõem internals de parsing e mutação de gateway.

## Fluxo de dados validado

1. O shell autenticado monta `NotificationsProvider`.
2. O provider consulta lista e contador em paralelo, assina `notification_deliveries` por `recipient_auth_user_id` e agenda refresh com debounce.
3. O gateway consulta `notification_deliveries` e a relação RLS-protegida `notification_events`; RPCs alteram somente o estado de leitura do próprio destinatário.
4. A rota cria colunas, filtros locais e detalhes; Sidebar e Security consomem o mesmo contexto.
5. Eventos externos à taxonomia `system | security | sync` são descartados silenciosamente pelo parser.

## Achados priorizados

### Alto

1. **Indisponibilidade convertida em sucesso vazio.** O gateway vazio retorna `[]`, `0` e resumos bem-sucedidos quando não há cliente Supabase. Em produção isso oculta configuração inválida e quebra observabilidade. Deve existir gateway produtivo fail-closed; gateway memory/empty somente por injeção explícita de teste.
2. **Carga não limitada e apenas client-side.** `listNotifications` não aplica `limit`, cursor nem filtro; `NOTIFICATIONS_FETCH_LIMIT` existe, mas não é usado. O crescimento histórico aumenta payload, normalização, memória e custo de renderização. Adotar paginação/cursor server-side, com contrato agregado de lista + contador quando justificar pelo plano de consulta.
3. **Respostas fora de ordem.** O provider usa um booleano apenas no efeito inicial; `refetch`, realtime e refresh pós-mutações concorrentes não têm generation guard/AbortSignal. Uma resposta antiga pode substituir estado recente ou estado de outro ciclo de sessão.

### Médio

4. **Atualização otimista sem rollback determinístico.** O reducer altera dados/contador antes da RPC e tenta recarregar após erro; se o reload também falhar, o estado otimista incorreto permanece e o erro original pode ser encoberto pelo segundo erro.
5. **Taxonomia inválida é silenciosamente omitida.** Linhas estruturalmente inválidas ou eventos com tipo novo são filtrados sem erro/telemetria. Isso transforma incompatibilidade de schema em perda invisível. Validar resposta completa por Zod e falhar de forma diagnosticável, ou modelar explicitamente itens rejeitados.
6. **Responsabilidades duplicadas/mortas.** `NotificationTypeIcon`, `NotificationsEmptyState`, `useNotificationsTableFilters`, helpers de filtro, contador/recentes e constantes de limite/persistência não são usados pela rota; o Sidebar recria as mesmas regras e copy. Escolher a implementação canônica e remover a outra.
7. **Contrato wire misturado ao domínio.** Interfaces Supabase snake_case e guards manuais vivem em `model`; criar `schemas/` para wire/RPC e `gateways/` para I/O, deixando `model/` apenas com domínio/regras puras.
8. **API pública excessiva.** O índice raiz exporta setters/reset do gateway e vários contratos internos; barrels aninhados aumentam caminhos equivalentes. Exportar somente provider/hook e tipos realmente interfeature; testes podem importar factories próprias.
9. **Erros perdem causa.** Falhas Supabase são substituídas por mensagens genéricas, sem código/correlation id e sem logging redigido. Preservar causa segura para monitoramento, sem expor detalhes internos na UI.
10. **Navegação imperativa inconsistente.** Uma ação usa `window.location.assign`, causando reload completo; a célula usa `Link`. Centralizar em navegação React e testar destino seguro.

### Baixo

11. A rota repete título/subtítulo já presentes em `notificationsCopy`.
12. O Sidebar exibe ISO cru em `occurredAt`, enquanto a tabela usa `formatDateTime`.
13. O ícone de atalho na ação não possui `data-icon`/atributos consistentes; a affordance de destino não explicita abertura na mesma aba.
14. O README descreve uma separação que o código ainda não cumpre; `VALIDATION.md` referencia artefato ZIP `/mnt/data` e validação isolada obsoleta.

## Segurança, privacidade e acesso

- **SQL injection:** o cliente usa query builder/RPC tipada e não concatena SQL; não foi encontrada superfície direta.
- **XSS/open redirect:** React escapa título/descrição e `isInternalNotificationHref` rejeita URLs absolutas e `//`. Convém também rejeitar controles, backslashes e caminhos não pertencentes ao registro de rotas, se os destinos forem estritamente internos.
- **CSRF:** alterações usam sessão Supabase e RPC; a fronteira real é RLS/`auth.uid()`, não tokens em query. As funções precisam continuar sem privilégio amplo e com `search_path` seguro.
- **Autorização:** a rota exige `notifications.read`; RLS limita leitura/alteração ao destinatário. A UI não deve ser considerada enforcement.
- **PII:** mensagens podem carregar dados arbitrários inseridos por writers. Criar política/taxonomia de conteúdo e testes para impedir CPF, token, IP, coordenada ou nome de banco em título/descrição/href por padrão.
- **Auditoria:** a leitura não precisa gerar audit event; criação do evento deve permanecer server-side com autor/origem. Mudança de estado de leitura é rastreável na entrega, porém hoje não há telemetria de falha do cliente.

## Acessibilidade e usabilidade

- Botões principais possuem nomes acessíveis; detalhes usam componente compartilhado e links internos reais.
- Faltam testes explícitos de teclado/foco, foco retornado após Sheet, atualização anunciada (`aria-live`) e estados loading/error/filtered-empty.
- O estado vazio canônico existe, mas não é passado à tabela; o Sidebar implementa outro copy/visual.
- Datas devem ser legíveis e semanticamente consistentes em tabela e popover.

## Cobertura de testes

Existem dois arquivos de feature e um teste do popover. Cobrem renderização básica, badges, menu e batch memory. Não cobrem:

- resposta inválida/novo tipo, ausência do cliente, falha e rollback de cada mutação;
- concorrência, resultado fora de ordem, troca de usuário, teardown Realtime e erro de canal;
- RLS/RPC com destinatário diferente, anon e usuário autenticado;
- paginação/truncamento, filtros/estado vazio e vazio filtrado;
- teclado, foco, live regions e viewports;
- segurança do `href` com `//`, URL absoluta, backslash, caracteres de controle e rota não registrada;
- ausência de PII/conteúdo interno por padrão.

## Matriz arquivo a arquivo

| Arquivo | Papel | Achado / ação recomendada |
| --- | --- | --- |
| `components/notification-type-icon.tsx` | Ícone semântico por tipo | Sem consumidor na feature; Sidebar duplica a regra. Adotar como fonte única fora de `components/ui` ou excluir. Adicionar `data-icon` ao SVG. |
| `components/notifications-empty-state.tsx` | Vazio total/filtrado | Sem consumidor. Integrar ao contrato da DataTable ou remover; unificar copy com Sidebar. |
| `constants/index.ts` | Barrel interno | Caminho alternativo desnecessário; remover após imports diretos. |
| `constants/notifications-constants.ts` | Limite/realtime/persistência | Só o debounce é efetivo; limite e chave são legados inertes. Implementar a política ou excluir. |
| `constants/notifications-copy.ts` | Copy da feature | Boa centralização, mas rota e Sidebar ainda têm hardcodes. Tornar canônico e remover duplicações. |
| `constants/notifications-labels.ts` | Labels de enum | Vistoriado; manter junto da taxonomia de domínio ou constants, com teste de exhaustividade. |
| `context/index.ts` | Barrel de contexto | Remover se o índice público raiz cobrir consumidores; evitar nested barrel. |
| `context/notifications-provider.tsx` | Estado, realtime e mutações | Grande e com concorrência/rollback frágeis. Extrair reducer/controller testável, generation guard e cancelamento; preservar erro original. |
| `docs/README.md` | Documentação local | Atualizar estrutura/contratos/RLS/estados e limites após refatoração. |
| `docs/VALIDATION.md` | Checklist histórico | Obsoleto e referencia ZIP externo. Consolidar no README ou substituir por comandos reais do repositório. |
| `hooks/use-notifications-table-filters.ts` | Filtros memoizados | Morto; a rota recria filtros. Usar este hook ou removê-lo após escolher API única. |
| `index.ts` | API pública | Muito amplo: expõe mutadores de gateway e wire. Estreitar para provider/hook/tipos compartilhados. |
| `model/index.ts` | Barrel de model | Expõe guards/wire/helpers internos. Remover barrel interno e importar responsabilidades diretamente. |
| `model/notifications-details-model.ts` | Presenter de detalhes | Coeso; mover para `components`/`presenters` se permanecer dependente de `AppDetailsSheet`. Hoje `model` depende de UI. |
| `model/notifications-parsers.ts` | Guards/normalização wire | Guardas manuais aceitam strings sem limites e descartam linhas. Substituir por schemas Zod estritos e adapter explícito. |
| `model/notifications-rules.ts` | Regras puras | URL interna útil; contador/recentes/unread helpers estão sem consumidor ou duplicados. Reutilizar no Sidebar ou remover. Validar limite não negativo. |
| `model/notifications-types.ts` | Domínio, wire e gateway | Responsabilidades misturadas. Separar domínio em `model`, wire em `schemas` e porta em `gateways`. |
| `routes/notifications-route.tsx` | Composição de página | Recria filtros e hardcodes; usar copy/hook/vazio/persistência canônicos. Manter regra de negócio fora da rota. |
| `services/index.ts` | Barrel interno | Remover; serviço/caso de uso deve depender da porta, não expor toda implementação. |
| `services/notifications-service.ts` | Supabase, realtime e façade | Mistura adapter, criação/fallback e casos de uso; lista ilimitada; erro genérico; estado global mutável. Separar gateway Supabase e use cases; fallback somente em testes. |
| `table/index.ts` | Barrel de tabela | Remover após imports diretos/índice público estreito. |
| `table/notifications-columns.tsx` | Colunas e ações | Em geral modular; trocar reload imperativo por navegação in-app, `data-icon`, e preservar acessibilidade/erro observável. |
| `table/notifications-filter-options.ts` | Opções locais de filtro | Indiretamente morto porque o hook não é usado. Reutilizar ou excluir quando houver filtros server-side. |

## Plano de refatoração e aceite

1. Criar `gateways/notifications-gateway.ts`, `gateways/supabase-notifications-gateway.ts`, `schemas/notification-wire-schema.ts` e manter domínio puro em `model/`.
2. Tornar cliente ausente um erro produtivo; memory gateway permanece apenas em `tests/helpers` e é injetado explicitamente.
3. Adicionar cursor/limite server-side, generation guard e `AbortSignal` quando suportado; impedir que respostas de sessão anterior sejam aplicadas.
4. Unificar ícone, contador, recentes, copy, formatação de data, filtros e vazios entre rota e Sidebar; remover arquivos comprovadamente mortos e barrels internos.
5. Implementar rollback determinístico, preservar causa segura e instrumentar falhas sem PII.
6. Estreitar o índice público e documentar dependências permitidas (`app`, Sidebar e Security).
7. Adicionar testes de schema/adapter, RLS/RPC, concorrência, erro/rollback, navegação segura, acessibilidade e paginação.

Aceite: nenhuma configuração ausente aparece como caixa vazia; nenhuma resposta antiga vence a atual; lista é limitada; somente o destinatário lê/altera sua entrega; conteúdo inválido é observável; Sidebar e rota compartilham as mesmas regras; testes e documentação refletem a arquitetura final.
