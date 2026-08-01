# Auditoria forense adicional — `src/features/audit`

Data: 2026-08-01
Estado: revisão adicional concluída; ajustes incrementais pendentes
Escopo: 20 arquivos da feature, 6 testes, fixture de gateway, writers, migration/policy e rota autenticada

## Conclusão

A estrutura segue o padrão de referência de `users` com responsabilidades bem delimitadas: rota fina, componente de tabela, hook, caso de uso, gateway Supabase, schema Zod, domínio e presenters. Não há fallback sintético, escrita no browser, SQL concatenado, HTML inseguro ou deep import entre features. A leitura falha de forma fechada e a policy vigente exige `audit.read`.

A revisão encontrou drift entre writers e apresentação: a migration `20260801131336_clients_units_feature_hardening.sql` passou a gravar `unit.yard_created`, ainda ausente de `auditEventLabels`. A interface humaniza o identificador, porém perde a tradução/taxonomia controlada. O inventário de metadata também não está formalmente ligado aos writers, logo campos novos podem desaparecer silenciosamente do painel por causa da allowlist. A documentação canônica contém números históricos que já não representam o baseline atual.

## Achados

| ID | Severidade | Achado | Correção recomendada |
| --- | --- | --- | --- |
| AU-01 | Média | `unit.yard_created` não possui label controlado, embora seja emitido pela migration mais recente. | Adicionar o evento à taxonomia e teste que compara os eventos conhecidos emitidos pelos writers. |
| AU-02 | Média | Chaves de metadata novas são descartadas silenciosamente quando não constam da allowlist. | Definir contrato/taxonomia compartilhada dos writers e testar chaves permitidas, redigidas e proibidas. |
| AU-03 | Média | A proteção assíncrona ignora resposta obsoleta, mas não cancela a consulta HTTP. | Permitir `AbortSignal` no gateway e cancelar ao refetch/desmontar, preservando o generation guard. |
| AU-04 | Média | A consulta continua limitada aos 500 eventos mais recentes; filtros/exportação são apenas do recorte. | Implementar paginação por cursor e filtros/exportação autorizados no servidor quando o volume exigir; manter aviso de truncamento até lá. |
| AU-05 | Média | Redaction visual cobre URLs e duas mensagens técnicas, mas não possui política explícita para e-mail, IP, host, coordenadas, tokens ou nomes internos. | Criar sanitizador transversal testado e classificação por campo; não aplicar regex destrutiva à evidência canônica. |
| AU-06 | Baixa | O composition root é um singleton global mutável usado por testes. | Preferir injeção no service/hook ou garantir lifecycle de reset automático para impedir vazamento entre testes/SSR. |
| AU-07 | Baixa | `README.md` registra 62 migrations, 269 testes e evidência remota histórica; hoje são 63 migrations e 281 testes. | Separar contrato vigente de evidência datada e atualizar números após o gate final. |
| AU-08 | Baixa | Não há teste E2E/RLS negativo para ator sem `audit.read` nesta suíte. | Adicionar teste de banco local por papéis/capabilities e teste de rota negada no router. |

## Segurança, privacidade e rastreabilidade

- A Data API usa sessão autenticada e RLS; o frontend não usa `service_role`.
- O SELECT é explícito e o schema é `.strict()`, impedindo campos inesperados de atravessar a fronteira.
- React escapa valores e a feature não usa `dangerouslySetInnerHTML`.
- Metadata só é apresentada por allowlist; objetos/arrays não são renderizados.
- IDs de ator/alvo permanecem no modelo, mas não aparecem por padrão; ID do evento e request ID sustentam investigação.
- O risco principal não é SQL injection, XSS ou CSRF nesta leitura, e sim exposição indevida em `reason`, `actor`, `target` ou metadata gravada por writers. A sanitização visual deve complementar, nunca substituir, minimização no writer e política de retenção.
- O frontend não cria logs paralelos. Erros preservam `cause`; uma solução transversal de telemetria deve redigir payload e correlation IDs.

## Performance e compatibilidade

A consulta usa `range(0, 500)`, inclusivo, para buscar 501 linhas e detectar truncamento; devolve no máximo 500. O índice `(occurred_at desc, id desc)` é compatível com a ordenação atual. Conversão, ordenação e facetas são limitadas e memoizadas, sem N+1. A próxima escala deve usar cursor `(occurred_at,id)`, e não offset crescente.

Zod 4, Supabase JS e React 19 são usados por APIs estáveis do projeto. O schema aceita ISO com offset e UUIDs. O gateway ainda não expõe cancelamento, apesar de Supabase/PostgREST suportar sinal de aborto no builder; a implementação deve ser confirmada contra a versão fixada antes de alterar o contrato.

## Acessibilidade e usabilidade

A tabela tem nome acessível, estados vazio/filtrado/erro/loading, resultado e severidade textuais, detalhes em sheet e exportação compartilhada. Os testes cobrem abertura e retry, mas não verificam foco devolvido, Escape, navegação completa por teclado, leitor de tela, viewport estreito nem conteúdo longo. Esses casos devem entrar no gate browser final.

## Matriz por arquivo

| Arquivo | Responsabilidade | Revisão | Ação |
| --- | --- | --- | --- |
| `README.md` | Contrato e evidências | Completo, porém números/evidência remota estão datados. | Atualizar e separar estado vigente de histórico. |
| `components/audit-table.tsx` | DataTable, filtros, exportação e estados | Bem delimitado. | Manter; testar conteúdo longo e acessibilidade. |
| `constants/audit-copy.ts` | Copy | Centralização adequada. | Acrescentar textos somente quando usados. |
| `constants/audit-labels.ts` | Taxonomia | Falta `unit.yard_created`; controle manual pode derivar dos writers. | Completar e criar teste de paridade. |
| `constants/audit-persistence.ts` | Limite e storage key | Adequado. | Versionar a chave apenas em mudança incompatível. |
| `gateways/audit-gateway-contracts.ts` | Contrato de I/O | Simples; sem paginação/cancelamento. | Evoluir para request tipado com cursor/filtros/signal. |
| `gateways/audit-gateway.ts` | Composition root | Singleton global mutável. | Substituir por injeção ou lifecycle seguro. |
| `gateways/supabase-audit-gateway.ts` | Query e validação | Projeção/limite/ordenação corretos. | Adicionar abort e, na próxima escala, cursor. |
| `hooks/use-audit.ts` | Estado e concorrência | Generation guard correto; timer artificial e sem abort. | Usar controller cancelável e preservar retry não bloqueante. |
| `model/audit-event-details.ts` | Detalhes allowlisted | Seguro por padrão; drift de metadata é silencioso. | Testar contrato dos writers e classificar chaves. |
| `model/audit-event-labels.ts` | Fallback legível | Robusto para desconhecidos. | Manter como fallback, não como substituto da taxonomia. |
| `model/audit-models.ts` | Wire para domínio e ordenação | Puro e determinístico. | Manter; evitar ordenação duplicada quando cursor remoto for adotado. |
| `model/audit-outcome.ts` | Resultado/severidade | Puro e correto. | Vistoriado — sem achado. |
| `model/audit-presentation.ts` | Normalização/redaction visual | Boa defesa inicial; política incompleta. | Extrair sanitização transversal e ampliar testes. |
| `model/audit-types.ts` | Domínio/snapshot | Wire separado corretamente. | Evoluir snapshot com cursor sem misturar tipos externos. |
| `routes/audit-route.tsx` | Página e detalhes | Rota fina. | Vistoriado — sem achado. |
| `schemas/audit-gateway-schema.ts` | Contrato externo | Strict e com limites textuais; metadata sem limite estrutural. | Limitar tamanho/profundidade/chaves ou projetar metadata segura no backend. |
| `services/audit-service.ts` | Caso de uso | Pequeno e legível. | Receber gateway/request explicitamente ao evoluir paginação. |
| `table/audit-columns.tsx` | Colunas/presentação/export | Reutiliza helpers e redaction. | Testar CSV/XLSX contra fórmulas e valores sensíveis no exportador compartilhado. |
| `table/audit-filter-options.ts` | Facetas | Valores alinhados à apresentação. | Migrar filtros ao servidor junto com paginação. |

## Testes vistoriados

| Arquivo | Estado e lacuna |
| --- | --- |
| `audit-gateway-schema.test.ts` | Cobre shape, UUID, data, enum e strict; falta limites/metadata adversarial. |
| `audit-models.test.ts` | Cobre evidência, redaction, alias, ordem e tom; falta taxonomia completa dos writers. |
| `use-audit.test.tsx` | Cobre resposta fora de ordem e retry; falta aborto/desmontagem verificável. |
| `supabase-audit-gateway.test.ts` | Cobre 501/500, ordem e payload inválido; falta erro Supabase, cliente ausente e signal. |
| `audit-service.test.ts` | Cobre mapper/truncamento. | Manter e ampliar para request cursor. |
| `audit-route.test.tsx` | Cobre render, export, detalhes, truncamento e retry; falta teclado/foco/viewport. |
| `tests/helpers/audit-memory-gateway.ts` | Fixture explicitamente test-only. | Manter fora do bundle produtivo. |

## Critérios para encerrar a próxima implementação

- Taxonomia reconhece todos os eventos emitidos no estado final das migrations/Edge Functions.
- Metadata possui classificação explícita: visível, redigida ou proibida.
- Consulta pode ser cancelada e respostas obsoletas continuam sem efeito.
- Ator sem `audit.read` recebe zero linhas no teste RLS e não acessa a rota.
- README reflete baseline final e identifica evidência remota por data.
- Testes focados, lint, typechecks, suíte, build, Deno check, reset/lint/advisors e browser console passam.
