# Feature `audit`

## Objetivo

Esta feature apresenta, em modo somente leitura, a trilha de eventos persistida em `public.audit_events`. Ela permite buscar, filtrar, ordenar, paginar localmente, exportar o recorte carregado e inspecionar detalhes sem transformar a interface em fonte de autorização ou de verdade.

`src/features/users` foi usado como referência de organização para páginas administrativas com tabela. A feature mantém a mesma separação entre rota, componente de tabela, hook, serviço, gateway, schema externo, modelo e configuração de colunas, sem copiar wrappers específicos de usuários.

## Estado da refatoração

A onda de refatoração de 2026-08-01 foi concluída no escopo do frontend de auditoria.

- O gateway produtivo consulta Supabase; não existe fallback sintético em produção.
- O contrato externo é validado por Zod antes de alcançar o domínio.
- A consulta possui limite explícito, ordenação determinística e detecção de truncamento.
- A rota informa quando registros anteriores não foram carregados.
- Exportação utiliza o menu canônico do DataTable e diferencia página, filtrados e carregados.
- A evidência canônica não é reescrita; redação e humanização são apenas de apresentação.
- Respostas assíncronas antigas não podem sobrescrever uma recarga mais recente.
- Barrels internos, pipeline de filtros paralelo e normalização legada foram removidos.
- Nenhum arquivo de `src/components/ui` foi alterado.
- A inspeção integrada confirmou 137 eventos reais no remoto. Uma migration aditiva criou a ordenação composta `occurred_at desc, id desc` e tornou a avaliação da permissão da policy estável por statement; migrations históricas não foram reescritas.
- A rota autenticada foi validada no navegador contra esses dados reais, sem fallback sintético, erro de console ou violação automatizada de acessibilidade.

## Fluxo de dados

```text
router lazy loader
  -> AuditRoute
     -> useAudit
        -> listAuditEvents
           -> getAuditGateway
              -> createSupabaseAuditGateway
                 -> public.audit_events (Supabase Data API + sessão do usuário)
                 -> auditEventRowsSchema
           -> toAuditEvent + sortAuditEvents
     -> AuditTable
        -> DataTable + filtros + exportação
     -> AppDetailsSheet
        -> getAuditEventDetails
```

A autorização real permanece no banco. O router exige `audit.read` para expor a rota, mas isso é apenas uma barreira de experiência. A policy RLS presente nas migrations locais também exige `audit.read`; o frontend nunca usa `service_role` e não executa escrita nessa tabela.

## Estrutura e responsabilidades

```text
src/features/audit
├── components/
│   └── audit-table.tsx
├── constants/
│   ├── audit-copy.ts
│   ├── audit-labels.ts
│   └── audit-persistence.ts
├── gateways/
│   ├── audit-gateway-contracts.ts
│   ├── audit-gateway.ts
│   └── supabase-audit-gateway.ts
├── hooks/
│   └── use-audit.ts
├── model/
│   ├── audit-event-details.ts
│   ├── audit-event-labels.ts
│   ├── audit-models.ts
│   ├── audit-outcome.ts
│   ├── audit-presentation.ts
│   └── audit-types.ts
├── routes/
│   └── audit-route.tsx
├── schemas/
│   └── audit-gateway-schema.ts
├── services/
│   └── audit-service.ts
├── table/
│   ├── audit-columns.tsx
│   └── audit-filter-options.ts
└── README.md
```

| Arquivo | Responsabilidade | Decisão de manutenção |
| --- | --- | --- |
| `components/audit-table.tsx` | Compor DataTable, estados vazios, filtros, exportação e persistência visual | Não mover regra de negócio ou I/O para este arquivo |
| `constants/audit-copy.ts` | Centralizar textos e mensagens da feature | Copy variável deve continuar fora de JSX e serviços |
| `constants/audit-labels.ts` | Definir enums visuais, labels de eventos atuais e aliases históricos identificados | Alias histórico só pode ser removido após confirmar ausência no período de retenção e no banco remoto |
| `constants/audit-persistence.ts` | Limite de leitura e versão do estado persistido | Alterações incompatíveis no estado da tabela exigem nova versão da chave |
| `gateways/audit-gateway-contracts.ts` | Contrato abstrato de I/O | Testes usam implementação memory explícita; produção usa Supabase |
| `gateways/audit-gateway.ts` | Composition root e injeção controlada | Não adicionar fallback automático em memória |
| `gateways/supabase-audit-gateway.ts` | Query Supabase, projeção mínima, limite sentinela e validação da resposta | Erro remoto ou payload inválido deve falhar de forma fechada |
| `hooks/use-audit.ts` | Estado React, carregamento, retry e controle de concorrência | Preservar dados já carregados durante retry e ignorar respostas obsoletas |
| `model/audit-event-details.ts` | Montar itens permitidos para o painel de detalhes | Metadata usa allowlist; dados desconhecidos não são apresentados |
| `model/audit-event-labels.ts` | Resolver labels conhecidas e fallback legível | O código bruto do evento continua disponível no modelo |
| `model/audit-models.ts` | Converter wire model validado e ordenar por instante | Não humanizar nem redigir a evidência nesta camada |
| `model/audit-outcome.ts` | Resolver texto e tom de resultado/severidade | Funções puras, sem dependência de React ou Supabase |
| `model/audit-presentation.ts` | Redigir URL/mensagem técnica e limitar texto exibido | Atua somente na saída visual; não altera o registro canônico |
| `model/audit-types.ts` | Tipos internos de evento, snapshot e detalhe | Tipos de wire permanecem em `schemas` |
| `routes/audit-route.tsx` | Compor página, seleção e sheet | A rota não conhece Supabase, Zod, colunas ou algoritmos de filtro |
| `schemas/audit-gateway-schema.ts` | Validar UUID, ISO 8601, enums, tipos e limites do payload | Alterações no SELECT e no schema devem ser revisadas juntas |
| `services/audit-service.ts` | Executar o caso de uso de listagem e montar snapshot | Único ponto entre gateway e modelo para esta operação |
| `table/audit-columns.tsx` | Definir apresentação, ordenação e valores exportáveis por coluna | Colunas ocultas de ID, request ID e motivo continuam exportáveis |
| `table/audit-filter-options.ts` | Criar facetas de responsável, escopo, evento e severidade | Deve usar os mesmos valores apresentados pelos accessors das colunas |
| `README.md` | Contrato arquitetural, segurança, riscos e validações | Atualizar no mesmo commit de mudanças estruturais relevantes |

## Contrato externo

O SELECT produtivo solicita somente:

```text
id, occurred_at, scope, event, actor, actor_user_id,
target, target_user_id, success, severity, reason,
request_id, metadata
```

O schema rejeita:

- IDs de evento/ator/alvo que não sejam UUID quando presentes;
- timestamp fora de ISO 8601 com timezone;
- escopo diferente de `login | system`;
- severidade diferente de `info | warning | critical`;
- sucesso que não seja booleano;
- strings vazias onde o banco exige conteúdo;
- texto acima dos limites defensivos da interface;
- propriedades que não façam parte da projeção aprovada.

Um payload inválido não recebe defaults silenciosos e não vira um registro de 1970. A listagem falha com mensagem pública estável e mantém o erro original apenas como `cause`, evitando vazar detalhes técnicos na interface.

## Segurança e privacidade

### Controles implementados

- RLS continua sendo a autoridade de acesso no Data API; a rota não substitui a policy.
- O browser utiliza somente o cliente autenticado configurado pela aplicação.
- Não existe SQL dinâmico, concatenação de filtros PostgREST, escrita, `dangerouslySetInnerHTML` ou navegação construída a partir do payload.
- React escapa os textos renderizados e o exportador compartilhado escapa XML e rejeita valores não exportáveis.
- URLs e mensagens de infraestrutura conhecidas são redigidas na apresentação.
- Caracteres de controle são removidos e textos visuais são limitados a 1.000 caracteres.
- Metadata é mostrada por allowlist; valores compostos e chaves desconhecidas são descartados da apresentação.
- IDs internos de ator e alvo não são apresentados por padrão. ID do evento e request ID ficam disponíveis para rastreabilidade.
- Erros do backend não produzem dados ou sucesso sintético.

### Riscos que pertencem a outras camadas

- Schema remoto, grants, policy efetiva e Advisors foram inspecionados. O lint do banco não apontou erro; o único warning de segurança remanescente é proteção contra senhas vazadas, indisponível no plano Free atual.
- Escritores de auditoria em Edge Functions devem decidir explicitamente se falha de persistência bloqueia ou apenas registra warning para cada operação crítica.
- Retenção de 90 dias e integridade de longo prazo são políticas do banco, não desta UI.
- CSRF não é introduzido por esta feature de leitura; cookies/sessões e CORS continuam responsabilidade da camada de autenticação e infraestrutura.
- O projeto ainda não possui uma abstração compartilhada de telemetria no cliente. A feature preserva `cause` e apresenta fallback seguro, mas não inventa `console` ou integração isolada; observabilidade deve ser adotada transversalmente.

## Performance e escalabilidade

O gateway pede `AUDIT_EVENTS_FETCH_LIMIT + 1` linhas por meio de `range(0, limit)`. A linha adicional funciona como sentinela e permite declarar truncamento sem o custo de uma contagem exata em toda a tabela. Apenas as primeiras 500 linhas entram no estado React.

A consulta ordena por `occurred_at desc, id desc`, evitando paginação instável quando dois eventos compartilham timestamp. No cliente:

- conversão e ordenação são `O(n log n)` sobre no máximo 500 eventos;
- facetas são memoizadas por snapshot;
- colunas são memoizadas pela callback de detalhes;
- apresentação não altera o payload de origem;
- nenhuma chamada N+1 é executada.

O limite atual é uma proteção, não paginação completa. Para volumes que exijam consulta histórica, a próxima evolução deve ser paginação cursor-based no backend, com filtros e exportação remotos sob o mesmo contrato. Antes disso, deve-se medir `EXPLAIN (ANALYZE, BUFFERS)` e decidir por migration aditiva um índice compatível com `occurred_at desc, id desc`; migrations já publicadas não devem ser reescritas.

O estado local e remoto agora possui `audit_events_occurred_id_idx (occurred_at desc, id desc)`. A policy avalia `private.has_current_user_permission('audit.read')` por meio de um subselect escalar, permitindo initplan por statement sem mudar a decisão de autorização. Contratos SQL confirmam nome, expressão e grants; remoção de outros índices só poderá ocorrer com plano real e janela representativa de estatísticas.

## Acessibilidade e usabilidade

- A tabela recebe nome acessível específico: “Trilha de eventos de auditoria”.
- Busca, filtros, ordenação, paginação, opções de coluna e exportação usam os controles compartilhados e seus estados de teclado/foco.
- Estados vazio e vazio filtrado usam `AppEmptyState`/shadcn `Empty`.
- Loading e refetch mantêm anúncios `aria-live` providos pelo DataTable.
- Abertura por responsável usa um botão textual; detalhes também são alcançáveis pelo menu de ações da linha.
- `AppDetailsSheet` fornece título, descrição e comportamento responsivo compartilhados.
- Resultado e severidade não dependem apenas da cor: ambos têm labels textuais.
- Colunas técnicas ficam ocultas por padrão, mas podem ser habilitadas no controle de colunas.

## Tratamento de erro e concorrência

`useAudit` usa uma geração monotônica para cada carregamento. Somente a geração mais recente pode atualizar dados, erro ou loading. Ao desmontar, a geração é invalidada; uma Promise tardia não atualiza o componente desmontado.

No retry:

1. a tabela preserva o snapshot anterior;
2. limpa o erro visível;
3. anuncia atualização;
4. substitui o snapshot somente após resposta válida;
5. apresenta novamente um estado de erro previsível se a tentativa falhar.

## Testes

Os testes específicos ficam em `tests/features/audit` e as fixtures injetáveis em `tests/helpers/audit-memory-gateway.ts`.

| Arquivo | Cobertura principal |
| --- | --- |
| `audit-gateway-schema.test.ts` | Contrato válido, UUID, timestamp, enums e propriedades não permitidas |
| `audit-models.test.ts` | Preservação canônica, redação visual, allowlist, labels atuais/históricas e ordenação |
| `audit-service.test.ts` | Mapeamento do gateway e propagação de truncamento |
| `supabase-audit-gateway.test.ts` | Projeção limitada, ordenação determinística, sentinela e falha fechada |
| `use-audit.test.tsx` | Concorrência e descarte de resposta obsoleta |
| `audit-route.test.tsx` | Cabeçalho, exportação compartilhada, detalhes, rastreabilidade, truncamento, erro e retry |

Última evidência focada desta refatoração:

```text
6 arquivos de teste aprovados
20 testes aprovados
0 falhas
32,89 s de duração total
```

### Evidência de validação em 2026-08-01

| Gate | Resultado |
| --- | --- |
| ESLint completo | Aprovado |
| TypeScript da aplicação | Aprovado |
| TypeScript dos testes | Aprovado |
| Testes focados de auditoria | 6 arquivos / 20 testes aprovados em 32,89 s |
| Testes combinados `users` + `audit` | 16 arquivos / 50 testes aprovados em 97,51 s |
| Vitest completo | 77 arquivos / 269 testes aprovados em 445,26 s |
| Build de produção | Aprovado; 913 módulos transformados |
| Chunk `audit-route` | 13,44 kB / 4,93 kB gzip |
| Orçamento de bundle | Aprovado; 1.741.693 / 2.097.152 bytes |
| Auditoria de dependências de produção | Nenhuma vulnerabilidade conhecida |
| Supabase local/remoto | Reset, contratos e ambos os lints aprovados; 62 migrations pareadas |
| Navegador autenticado | Dados reais, console sem erro, axe com zero violações e zero itens inconclusivos |
| `git diff --check` | Aprovado |
| `pnpm validate` | Aprovado; 794 arquivos, 471 fontes e 62 migrations inventariados |

O validador global agora acompanha as fronteiras atuais de `users` e `audit`; os seis invariantes literais obsoletos foram removidos sem reintroduzir símbolos legados.

## Código removido

- `hooks/use-audit-table-state.ts`: estado e filtragem paralelos sem consumidor.
- `model/audit-filtering.ts`: segundo algoritmo de filtro divergente do DataTable.
- `model/audit-normalization.ts`: aliases frouxos, coerção de tipos e timestamp inválido convertido para epoch.
- `model/audit-metadata.ts`: responsabilidade renomeada e separada entre apresentação e detalhes.
- `services/audit-gateway.ts`: contrato, schema, adapter e composition root indevidamente acoplados.
- `index.ts`, `constants/index.ts`, `model/index.ts`, `services/index.ts`, `table/index.ts`: barrels sem consumidor que ampliavam a superfície e ocultavam dependências.
- `docs/README.md` e `docs/VALIDATION.md`: documentação duplicada; este arquivo é a fonte canônica da feature.

## Próximas ondas fora deste escopo

1. Medir o plano da consulta sob volume maior e implementar paginação cursor-based, filtros remotos e exportação assíncrona quando o limite de 500 deixar de ser suficiente.
2. Formalizar a taxonomia de eventos entre todos os writers; manter aliases somente durante a retenção necessária.
3. Definir política de falha e correlation ID para cada writer de auditoria nas Edge Functions, com redaction transversal.
4. Adicionar teste E2E de negação para perfil sem `audit.read` e validação humana com leitor de tela; o fluxo owner, teclado básico, mobile e axe já foram exercitados.
5. Versionar a política de retenção/arquivamento e testar restauração antes de qualquer limpeza histórica.

## Referências

- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase JavaScript — select](https://supabase.com/docs/reference/javascript/select)
- [Supabase JavaScript — order](https://supabase.com/docs/reference/javascript/using-modifiers-order)
- [Supabase JavaScript — range](https://supabase.com/docs/reference/javascript/using-modifiers-range)
- [shadcn/ui — Data Table](https://ui.shadcn.com/docs/components/data-table)
- [shadcn/ui — Empty](https://ui.shadcn.com/docs/components/empty)
- [shadcn/ui — Sheet](https://ui.shadcn.com/docs/components/sheet)
- [React — Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- `src/features/users/README.md` — referência interna de organização e fronteiras administrativas.
- `docs/current/2026-07-31__data-table-filter-refactor.md` — decisões internas de tabela, filtros e composição.
