# Revisão forense — `users` e `audit`

Data de fechamento: 1º de agosto de 2026.

## Escopo e rastreabilidade

Esta revisão cobre individualmente os 26 arquivos de produção de `src/features/users`, os 20 arquivos de `src/features/audit` e os 16 testes diretamente associados. A matriz por arquivo, incluindo responsabilidade, consumidor, achado e decisão, é mantida nas fontes normativas:

- [`src/features/users/README.md`](../../src/features/users/README.md#inventário-forense-por-arquivo);
- [`src/features/audit/README.md`](../../src/features/audit/README.md#estrutura-e-responsabilidades).

Foram inspecionados ainda os consumidores compartilhados indispensáveis para reproduzir os fluxos — DataTable, detalhes, tabs, sidebar e cliente Supabase — sem transformar a revisão em refatoração irrestrita. `src/components/ui` permaneceu intacto.

O levantamento combinou leitura estática, comparação com `HEAD`, alcance de imports, ESLint, dois typechecks, testes unitários/de integração, build, navegador autenticado desktop/mobile, console, axe, reset/lint do Supabase, contratos SQL, Advisors e execução real das integrações remotas.

## Veredito

As duas features agora seguem a mesma arquitetura de referência sem duplicar implementação: rota compõe, componente apresenta, hook orquestra React, serviço executa o caso de uso, gateway faz I/O, schema valida wire e model mantém regras puras. Barrels internos foram removidos; `users` mantém somente um barrel público estreito porque possui consumidor externo, enquanto `audit` é carregada diretamente pelo router.

Não existe fallback sintético no bundle produtivo de nenhuma das duas features. Falha de Supabase é apresentada como falha; não há toast de sucesso, dado fictício ou coerção permissiva que esconda erro remoto.

## Comparação estrutural

| Responsabilidade | `users` | `audit` | Decisão comum |
|---|---|---|---|
| Rota | autenticação, tabs e coordenação | seleção e detalhes | sem I/O ou regra de domínio |
| UI específica | formulário, ações, detalhes e tabela | tabela | compor shared/shadcn sem editar primitives |
| Hook | leitura e mutações concorrentes | leitura, retry e descarte de resposta obsoleta | generation guard; estado técnico não vaza para a UI |
| Serviço | comandos, unidade canônica e releitura | listagem e snapshot | validação em profundidade entre UI e gateway |
| Gateway | Data API, RPC e oito Edge Functions | Data API read-only | produção real; memory somente por injeção de teste |
| Schemas | formulário e múltiplos wires estritos | projeção única estrita | wire, formulário e domínio não são intercambiáveis |
| Model | política ator/alvo, labels e detalhes | evidência, redação visual e labels | funções puras, sem React ou Supabase |
| Table | colunas, filtros, ações e IDs tipados | colunas e filtros | DataTable compartilhada preserva paginação, estados e exportação |
| Barrel | um `index.ts` público estreito | nenhum barrel | deep/nested barrels excluídos |

## Achados de `users`

| Severidade | Achado confirmado | Correção e evidência |
|---|---|---|
| crítica | implementações históricas podiam aparentar mutação sem contrato produtivo verificável | gateway Supabase real, resultado relido do backend e memory gateway restrito ao setup de teste |
| alta | respostas de mutação e fatores aceitavam shape amplo demais | schemas Zod estritos e adapter wire → domínio; UUID, papel, status e identidades inválidas falham fechadas |
| alta | regras administrativas estavam distribuídas entre rota, coluna e backend | política pura ator/alvo e factory única de ações; Edge Function continua autoritativa |
| média | formulário, detalhes e dialogs duplicavam responsabilidade | componentes isolados e reutilização de `AppDetailsSheet`/composição de formulário |
| média | unidade visual poderia divergir do catálogo persistido | `unitId` é validado contra catálogo real e `unitName` é hidratado pelo backend |
| média | timestamp futuro poderia ser classificado como acesso recente | normalizador rejeita futuro e possui teste de regressão |
| média | resposta assíncrona antiga ou duplo envio poderia sobrescrever estado | generation guard e mutex de mutação no hook |
| acessibilidade | contraste, landmarks e foco precisavam de validação real | tokens semânticos e landmark da sidebar corrigidos fora de `components/ui`; axe sem violações e mobile sem overflow de página |

## Achados de `audit`

| Severidade | Achado confirmado | Correção e evidência |
|---|---|---|
| crítica | serviço anterior produzia eventos sintéticos mesmo existindo `audit_events` | gateway Supabase read-only real; fixture apenas por injeção explícita nos testes |
| alta | normalização permissiva convertia payload inválido em evidência aparente | projeção mínima, schema estrito e falha fechada; registro canônico não é reescrito |
| alta | policy repetia função de autorização por linha e a ordenação global não tinha índice correspondente | migration aditiva com initplan por statement e índice `(occurred_at desc, id desc)`; contratos local/remoto passaram |
| média | rota, filtros e normalização mantinham pipelines paralelos | `AuditTable`, DataTable canônica e models puros; arquivos legados removidos |
| média | detalhes podiam expor metadata ou infraestrutura sem política explícita | allowlist de metadata, redaction visual e limites de texto; dado original permanece no banco |
| média | paginação poderia ser instável em timestamps iguais | ordenação determinística por instante e UUID, limite sentinela de 501 para snapshot máximo de 500 |
| baixa | nested barrels ampliavam superfície sem consumidor | todos removidos; router importa a rota diretamente e preserva lazy loading |

## Segurança

| Vetor | Resultado |
|---|---|
| SQL injection | não há SQL ou filtro PostgREST construído com entrada livre nas features; constantes definem fontes e projeções |
| XSS | React escapa saída; não há `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou navegação derivada de payload |
| CSRF | `audit` é leitura; mutações de `users` usam JWT, `verify_jwt=true`, validação de sessão e autorização no handler |
| entrada adulterada | Zod na UI/serviço e na fronteira de wire; CPF/telefone normalizados; defaults não inventam identidade |
| escalada de privilégio | UI restringe usabilidade, mas RLS/Edge Functions decidem; wrappers públicos de sessão são invoker e implementações privilegiadas ficam em `private` |
| PII e logs | exportação de usuários desabilitada, dados sensíveis tratados por componente compartilhado e nenhum segredo/PII adicionado a logs |
| auditoria | mutações administrativas registram ator, alvo, sucesso/negação e metadata; UI de auditoria é somente leitura |
| rastreabilidade de erro | erro técnico permanece em `cause`; mensagem pública é estável e nenhuma falha produz falso sucesso |

## Supabase e integração real

O reset local aplicou toda a cadeia de migrations. Contratos SQL confirmaram RLS, grants, wrappers de sessão, índice/policy de auditoria, Vault e crons. O lint local e remoto retornou zero erro.

A validação operacional também revelou débitos transversais que afetavam o console e os logs, embora não pertencessem ao código de UI das duas features:

- a RPC de perfil chamava implementação privada sem o contrato de execução necessário; wrappers públicos invoker e implementação privada definer corrigiram o `403` sem abrir privilégios a `anon`/`public`;
- crons de ERP continham contrato de segredo/timeout inadequado; segredos foram rotacionados e passaram ao Vault;
- o sync de clientes/veículos excedia o limite do Edge Runtime e gravava nomes de contadores inexistentes; o fluxo passou a cliente + oito partições determinísticas de veículos, com cursor retomável e checkpoint apenas no fechamento;
- o ciclo remoto final processou 28.552 clientes e 124.912 veículos ativos, sem duplicatas de ID/placa; a Edge Function v51 registrou nove respostas HTTP 200 consecutivas.

O Advisor de segurança mantém somente `auth_leaked_password_protection`. A organização foi confirmada no plano Free e o recurso exige plano pago; não foi habilitado sem autorização de custo. Os Advisors de performance retornam apenas `INFO` de índices sem uso. Nenhum índice foi excluído com base apenas em contadores recém-inicializados.

Referências: [password security](https://supabase.com/docs/guides/auth/password-security), [Vault](https://supabase.com/docs/guides/database/vault), [scheduling functions](https://supabase.com/docs/guides/functions/schedule-functions), [function limits](https://supabase.com/docs/guides/functions/limits) e [status 546](https://supabase.com/docs/guides/functions/status-codes).

## Navegador, responsividade e acessibilidade

Com o owner local autenticado, `/usuarios` e `/auditoria` carregaram dados reais. Todas as requisições da aplicação observadas retornaram sucesso; o console apresentou somente mensagens informativas do Vite/React em desenvolvimento.

Em desktop e 390 × 844:

- não houve overflow horizontal da página; a rolagem larga ficou confinada à tabela;
- loading, vazio, vazio filtrado, erro e detalhes mantiveram nomes acessíveis;
- axe retornou zero violações nas duas rotas;
- `audit` não teve itens inconclusivos; em `users`, o axe não conseguiu determinar automaticamente o fundo de duas células parcialmente sobrepostas pela região rolável, sem classificá-las como violação;
- foco, títulos de Dialog/Sheet, labels textuais de severidade/resultado e controles da DataTable permaneceram operáveis.

## Evidência final de qualidade

| Gate | Resultado final |
|---|---|
| inventário/arquitetura | `pnpm validate` aprovado: 794 arquivos, 471 fontes e 62 migrations |
| ESLint | aprovado em todo o repositório |
| TypeScript | aplicação e testes aprovados |
| testes focados | 16 arquivos / 50 testes de `users` + `audit` aprovados em 97,51 s |
| Vitest completo | 77 arquivos / 269 testes aprovados em 445,26 s |
| build | 913 módulos; `users-route` 34,04 kB e `audit-route` 13,44 kB |
| bundle | 1.741.693 / 2.097.152 bytes |
| dependências | nenhuma vulnerabilidade de produção conhecida |
| Edge Functions | `deno check` aprovado nas 19 funções |
| banco local | reset integral, lint e contratos SQL aprovados |
| banco remoto | lint aprovado e migrations locais/remotas pareadas |
| navegador | dados reais, zero erro de página/console e zero violação axe nas duas rotas |

## Código legado e barrels removidos

Em `audit`, foram removidos o gateway monolítico, filtro paralelo, normalização permissiva, estado duplicado de tabela, documentação interna redundante e cinco barrels sem consumidor. O conteúdo válido foi distribuído entre gateway, schema, model, componente e README canônico.

Em `users`, a onda anterior já havia removido gateway em memória de produção, validação/IDs artificiais, dialogs duplicados, nested barrels e diretórios de documentação/tipos vazios. Esta revisão reforçou o wire do gateway e acrescentou regressões para concorrência e adapter Supabase.

## Riscos remanescentes justificados

1. `users` ainda carrega conjuntos completos antes da paginação local; um read model paginado só deve ser introduzido quando métricas de volume justificarem o novo contrato.
2. `audit` limita o snapshot a 500 eventos; paginação cursor-based e exportação assíncrona são a evolução correta para histórico maior.
3. A taxonomia de eventos e correlation ID precisam ser padronizados entre todos os writers, não por uma implementação isolada nesta feature.
4. A proteção contra senhas vazadas depende de upgrade pago do Supabase.
5. Índices marcados como não usados exigem janela representativa e `EXPLAIN (ANALYZE, BUFFERS)` antes de qualquer remoção.

## Critério de manutenção

Toda mudança futura em `users` ou `audit` deve atualizar a linha correspondente no README da feature, seus testes e este relatório quando alterar uma decisão transversal. Novos barrels, fallback sintético, deep import entre features, wire não validado ou edição direta de `components/ui` violam o baseline aprovado.
