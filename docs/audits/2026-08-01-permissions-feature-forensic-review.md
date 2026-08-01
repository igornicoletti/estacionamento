# Permissions — auditoria forense e plano de refatoração

Data da revisão: 1º de agosto de 2026.

## Escopo, método e limites

Esta revisão cobre individualmente os 22 arquivos de `src/features/permissions` e rastreia os consumidores e contratos necessários para validar o fluxo real: router, autenticação, DataTable compartilhada, Edge Function `list-permission-matrix`, helpers de sessão, migrations, schema efetivo do Supabase local e testes associados.

`src/features/users`, `src/features/audit`, `src/features/clients` e `src/features/units` foram usadas somente como referência arquitetural. Nenhum código funcional, componente de `src/components/ui`, migration ou estado remoto foi alterado. O worktree já continha uma modificação alheia em `src/features/dashboard/routes/dashboard-route.tsx`; ela foi preservada e não faz parte desta análise.

A inspeção do banco foi somente leitura e limitada ao Supabase local. O banco remoto não foi consultado. A validação visual em navegador não pôde ser executada porque nenhum navegador estava conectado à sessão; responsividade, foco real e leitor de tela permanecem critérios pendentes, não resultados aprovados.

## Parecer executivo

A feature tem uma base funcional melhor do que sua estrutura sugere: usa backend real, não possui fallback sintético em produção, falha quando a Edge Function falha, não monta SQL dinâmico, não renderiza HTML arbitrário e aplica autorização em três pontos — router, gateway de Edge Functions e handler. Os arquivos de produção têm menos de 100 linhas cada, TypeScript, ESLint, build e Deno check passam.

Apesar disso, `permissions` ainda não pode ser considerada migrada para o padrão das quatro features de referência. Há duas falhas confirmadas de autorização/integridade no schema local, metadados apresentados como se fossem canônicos embora sejam inferidos, validação externa permissiva, corrida assíncrona no hook, documentação contraditória e seis barrels que escondem dependências e expõem APIs usadas apenas por testes.

### Resultado por dimensão

| Dimensão | Avaliação | Síntese |
| --- | --- | --- |
| Integridade funcional | Requer correção | O catálogo ativo tem 17 permissões, mas três capabilities ainda declaradas no frontend não existem nele |
| Segurança | Requer correção prioritária | As tabelas podem ser consultadas diretamente por qualquer usuário ativo, contornando `permissions.read` |
| Arquitetura | Parcial | Não existem `gateways/` nem `schemas/`; wire, domínio e tabela estão misturados |
| Código limpo | Parcialmente adequado | Arquivos pequenos e tipados, porém há duplicação, código morto, heurísticas e barrels internos |
| Performance | Adequada ao volume atual | 17 permissões/43 vínculos; duas consultas paralelas e sem N+1, mas sem limite defensivo |
| Acessibilidade | Parcial | A infraestrutura compartilhada é acessível, mas a feature omite nome específico, estados próprios e testes de foco/teclado |
| Testes | Insuficiente para uma fronteira de autorização | 3 arquivos/7 casos; não há testes do adapter, schema, hook, Edge Function ou matriz RLS por papel |
| Documentação | Desatualizada | README e VALIDATION descrevem garantias ou comandos que não correspondem mais ao repositório |

## Fluxo real e funcionalidades

```text
route-registry (permissions.read)
  -> PermissionsRoute
  -> usePermissions
  -> permissions-service
  -> módulo global PermissionsGateway
  -> supabase.functions.invoke("list-permission-matrix")
  -> verify_jwt + sessão ativa + actorHasPermission("permissions.read")
  -> service-role lê app_permissions e app_role_permissions
  -> parser manual do frontend
  -> PermissionMatrixRow com campos de domínio e apresentação misturados
  -> DataTable / AppDetailsSheet
```

Funcionalidades efetivamente presentes:

- listagem somente leitura da matriz de permissões;
- busca por chave, nome e grupo;
- filtro local por grupo;
- paginação e controle de visibilidade fornecidos pela DataTable;
- colunas de acesso para owner, admin, auditor, manager e operator;
- painel de detalhes;
- retry após falha;
- expansão do wildcard `*`, fazendo owner aparecer com acesso a todas as permissões.

Não existem criação, edição, exclusão, exportação ou auditoria de leitura nesta feature. `source = custom`, filtro por origem, filtro por acesso e persistência declarada nas constantes não são funcionalidades alcançáveis na tela atual.

## Achados prioritários

### P1 — `permissions.read` pode ser contornada pela Data API

**Severidade: alta — controle de acesso inconsistente e exposição indevida da matriz.**

O estado efetivo do banco local confirmou:

- RLS habilitada em `app_roles`, `app_permissions` e `app_role_permissions`;
- `SELECT` concedido ao papel PostgreSQL `authenticated`;
- policy de leitura das três tabelas baseada somente em `private.current_user_status() = 'active'`;
- nenhuma delas exige `permissions.read`.

Ao mesmo tempo, o router e a Edge Function restringem a página a `permissions.read`. Portanto, manager e operator não veem a rota, mas um cliente autenticado ativo pode consultar diretamente papéis, catálogo e vínculos pelo Data API. A UI não explora esse caminho, porém a segurança não pode depender do cliente oficial.

**Correção recomendada:** tornar a Edge Function a única fronteira pública, revogando `SELECT` de `authenticated` nas três tabelas e removendo as policies de leitura direta em migration aditiva. Se houver consumidor direto legítimo ainda não identificado, a alternativa mínima é exigir `(select private.has_current_user_permission('permissions.read'))`. A primeira opção é preferível porque a própria documentação da feature declara uma fronteira única via Edge Function.

### P2 — catálogo ativo e contrato do frontend estão divergentes

**Severidade: alta — autorização e comportamento de negócio incorretos.**

O banco local contém 17 chaves e 43 vínculos. O frontend continua declarando três capabilities ausentes:

- `prices.manage`;
- `rules.manage`;
- `clients.sync.read`.

O histórico das migrations explica a perda:

1. `20260713170614_unify_permission_authorization.sql` inseriu `prices.manage` e `rules.manage` nas tabelas legadas `permissions`/`role_permissions`.
2. `20260715002310_auth_atomicity_and_public_surface_hardening.sql` voltou `private.current_user_permissions()` para `app_role_permissions`, sem migrar essas duas chaves.
3. `20260720213000_clients_rls_permissions_hardening.sql` inseriu `clients.sync.read` apenas no sistema legado.
4. `20260721104050_unify_permissions_cleanup_cron_passkey_fix.sql` excluiu as tabelas legadas.

Consequências confirmadas:

- admin não recebe `prices.manage` nem `rules.manage` pelo perfil real, embora o fallback TypeScript diga que recebe;
- operações e policies que exigem essas chaves ficam disponíveis somente ao owner por causa do wildcard `*`;
- a matriz apresentada não contém as três capabilities;
- `clients.sync.read` permanece no frontend e em policies históricas, apesar da remoção da UI de histórico/sincronização.

**Correção recomendada:** definir uma única matriz normativa e criar migration aditiva. `prices.manage` e `rules.manage` devem ser restauradas para os papéis aprovados, caso as operações administrativas permaneçam. Para `clients.sync.read`, a decisão padrão é removê-la do frontend e substituir/remover referências residuais se o histórico de sincronização continuar fora do produto; restaurá-la só é correto se houver consumidor autorizado real.

### P3 — origem, criticidade e grupos não são dados canônicos

**Severidade: média — informação de segurança potencialmente enganosa.**

`app_permissions` armazena apenas chave, nome, descrição e timestamps. `app_roles` possui os cinco papéis e seus labels, mas a Edge Function e o frontend mantêm listas paralelas. Além disso, a Edge Function:

- fixa todas as permissões como `source: "system"`;
- marca criticidade por prefixos hardcoded;
- deriva o grupo do primeiro segmento da chave;
- mantém labels de grupos duplicadas no backend e no frontend.

Assim, `custom` nunca ocorre e qualquer permissão futura será classificada por heurística. O texto “matriz registrada no banco” é apenas parcialmente verdadeiro.

**Correção recomendada:** decidir se origem e criticidade têm valor de negócio. Se tiverem, persistir e validar esses metadados na fonte canônica. Se não tiverem, remover campos, filtros, labels e detalhes associados. Não manter classificações de segurança inferidas por string.

### P4 — contrato externo permissivo e no local errado

**Severidade: média — dados inválidos podem ser aceitos ou silenciosamente reinterpretados.**

O gateway possui um schema Zod superficial para `{ data, error }`, enquanto as linhas são processadas por parser manual em `model`:

- strings são verificadas com `trim()`, mas o valor original não normalizado é retornado;
- não há limites de tamanho;
- IDs não são validados como chaves de permissão;
- propriedades extras são aceitas;
- papéis desconhecidos são descartados silenciosamente, subestimando acesso;
- `ok: true` não é validado;
- duplicidade de chaves não é rejeitada;
- o resultado redundante retornado pela Edge Function (`roleAccess`, `roleCount`, `roleLabels`) é ignorado e reconstruído.

**Correção recomendada:** criar `schemas/permissions-gateway-schema.ts` com Zod estrito, limites, regex da chave, enum de papéis e refinamentos de unicidade. O schema representa wire data; o serviço converte para domínio; o modelo de tabela adiciona campos derivados.

### P5 — carregamentos concorrentes podem sobrescrever estado novo

**Severidade: média — inconsistência de UI e teste ausente.**

`usePermissions` implementa o carregamento inicial e `refetch` em dois blocos diferentes. O `isMounted` protege somente o efeito inicial. Se retry e carregamento inicial, ou dois retries, terminarem fora de ordem, a resposta mais antiga pode substituir a mais nova e o primeiro `finally` pode desligar o loading enquanto outra chamada segue ativa.

**Correção recomendada:** usar o mesmo contrato de geração monotônica de `audit`/`useAsyncSnapshot`. Adicionar `AbortSignal` ao gateway apenas se o adapter suportar cancelamento real; generation guard é obrigatório independentemente disso.

### P6 — estrutura ainda diverge do padrão de referência

**Severidade: média — manutenção e escalabilidade prejudicadas.**

| Responsabilidade | Referências | `permissions` atual | Ajuste |
| --- | --- | --- | --- |
| Documentação | `README.md` na raiz | `docs/README.md` + `docs/VALIDATION.md` | consolidar em `README.md` |
| Gateway | contrato, composition root e adapter em `gateways/` | tudo em `services/permissions-gateway.ts` | separar três arquivos |
| Schema externo | `schemas/` | Zod inline + parser em `model` | criar schema dedicado |
| Componente de tabela | `{feature}-table.tsx` | DataTable montada na rota | extrair `permissions-table.tsx` |
| Modelo | wire separado do domínio | wire, domínio e tabela em `PermissionMatrixRow` | separar contratos |
| Barrels | zero internos; no máximo um público estreito | 6 arquivos `index.ts` | remover nested barrels; provavelmente remover também o root |
| Test seam | helpers em `tests/helpers` e imports diretos | gateway mutável exportado na API pública e seed global | manter seam interna e helper de teste |

O `index.ts` da raiz não possui consumidor de produção; somente testes o importam. Como o router já importa a rota diretamente e não há contrato entre features, o padrão de `audit` — sem barrel público — é o mais estreito.

### P7 — copy, filtros e persistência possuem implementações paralelas ou mortas

**Severidade: média.**

- título, subtítulo, busca, grupo e detalhes estão hardcoded na rota, apesar de já existirem em `permissionsCopy`;
- `usePermissionsTableFilters` não possui consumidor;
- o hook morto calcula filtro de origem, mas a rota recria apenas o filtro de grupo;
- `permissionAccessFilterLabels` e o filtro derivado de acesso não chegam à UI;
- `PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY` e `PERMISSIONS_DEFAULT_COLUMN_VISIBILITY` não são aplicados;
- `groupLabel` e `roleCount` ficam visíveis, deixando a tabela mais larga, embora a constante declare ambos ocultos.

**Correção recomendada:** adotar a copy e a persistência existentes no novo `PermissionsTable`; manter apenas filtros com semântica real. Remover origem/acesso se a decisão de produto não os exigir.

### P8 — “Chave” não exibe a chave técnica

**Severidade: média — perda de rastreabilidade.**

`formatTechnicalPermissionKey` transforma o valor antes de mostrá-lo. Chaves como `units.yard.manage`, `access_requests.read` e `sync.execute` podem ser reduzidas apenas ao nome do grupo porque o parser pressupõe que o segundo token seja uma ação conhecida. O teste denominado “showing the capability key” não verifica `audit.read`; ele procura novamente o label humano.

**Correção recomendada:** exibir a chave canônica sem transformação, preferencialmente em `<code>` com quebra segura. Se uma descrição humana adicional for desejada, ela deve ser um campo separado e nunca substituir a evidência técnica.

### P9 — cobertura insuficiente de autorização, contrato e acessibilidade

**Severidade: média.**

Existem somente 3 arquivos e 7 testes:

- service: delegação e propagação de erro;
- model: três regras derivadas;
- route: título e abertura de detalhes.

Não existem testes do schema, adapter Supabase, ausência de cliente, erro HTTP, resposta inválida, hook, concorrência, unmount, estados vazio/filtrado/erro/retry, persistência, filtros, semântica dos ícones, foco, teclado, viewport, Edge Function ou negação RLS por papel.

O script global `security-contracts.sql` passa, mas não testa grants, policies ou paridade do catálogo de permissões. O arquivo não é pgTAP; executá-lo com `supabase test db` produz “No plan found”, enquanto a execução direta pelo `psql` local passa.

### P10 — observabilidade existe, mas é incompleta

**Severidade: baixa.**

A Edge Function registra falhas de dependência e respostas inválidas sem tokens ou PII. Contudo:

- não há request/correlation ID;
- negação de autorização e leitura bem-sucedida não entram na trilha de auditoria;
- exceções inesperadas retornam HTTP 400 em vez de 500;
- o frontend não possui telemetria compartilhada e reduz 401/403/503 à mesma mensagem.

**Correção recomendada:** preservar mensagens públicas estáveis, mapear classes de erro para UX de sessão/permissão/indisponibilidade e adotar correlation ID transversal. Registrar leituras bem-sucedidas somente se houver exigência de compliance; negações e erros de segurança devem ser rastreáveis sem dados sensíveis.

## Levantamento forense por arquivo

| Arquivo | Responsabilidade atual | Achado | Severidade | Ação recomendada |
| --- | --- | --- | --- | --- |
| `components/index.ts` | Reexportar o ícone de acesso | Barrel usado apenas por `permissions-columns.tsx` | Baixa | Excluir e importar o arquivo diretamente |
| `components/permission-access-icon.tsx` | Representar acesso sim/não | Pequeno e reutilizável; falta `data-icon` e a semântica fica no SVG dinâmico | Baixa | Colocar nome acessível em wrapper estável e tornar o ícone decorativo com `aria-hidden`/`data-icon` |
| `constants/index.ts` | Reexportar todas as constantes | Oculta dependências entre constants/model e exporta símbolos mortos | Baixa | Excluir; usar imports diretos |
| `constants/permissions-constants.ts` | Chave e defaults de visibilidade | Ambos sem consumidor | Média | Aplicar no componente de tabela ou excluir se a persistência não for desejada |
| `constants/permissions-copy.ts` | Copy da feature | Bem centralizada, porém grande parte é ignorada pela rota; `sessionRequired` nunca é usada | Média | Tornar fonte única de texto e remover mensagens sem caminho observável |
| `constants/permissions-labels.ts` | Labels de papel, origem, grupo, ação e objeto | Duplica auth/Edge; origem custom e filtro de acesso estão mortos; mapeamento de chave é incompleto | Média | Manter apenas labels de apresentação necessárias e eliminar heurísticas/duplicações |
| `docs/README.md` | Descrever arquitetura e segurança | Contradiz o código ao negar schema Zod e afirmar tratamento específico de sessão | Média | Substituir por `README.md` canônico na raiz com fluxo e limites reais |
| `docs/VALIDATION.md` | Registrar comandos de validação | Contém `validation/tsconfig.json`, ZIP e `MANIFEST.json` de pacote histórico, não do projeto atual | Média | Incorporar evidências reproduzíveis ao README e excluir o documento obsoleto |
| `hooks/use-permissions-table-filters.ts` | Criar filtros de grupo/origem | Sem consumidor; grupo é duplicado na rota; origem é inalcançável; contagem usa múltiplos filtros | Média | Excluir ou substituir por factory/hook realmente consumido com uma única passagem |
| `hooks/use-permissions.ts` | Estado assíncrono e retry | Duplica carregamento e admite respostas fora de ordem | Média | Reusar `useAsyncSnapshot` ou generation guard equivalente; testar concorrência/unmount |
| `index.ts` | API pública ampla | Sem consumidor de produção; expõe gateway mutável, modelos e helpers apenas para testes | Média | Remover como em `audit`, ou reduzir ao único contrato entre features se um surgir |
| `model/index.ts` | Barrel do modelo | Reexporta wire, domínio, UI e parser; esconde fronteiras | Baixa | Excluir e usar imports diretos |
| `model/permissions-details-model.tsx` | Montar detalhes e humanizar chave | Mistura apresentação e regra; oculta a chave técnica e perde tokens desconhecidos | Média | Exibir chave canônica; separar formatter humano opcional dos itens do sheet |
| `model/permissions-parsers.ts` | Validar/normalizar payload desconhecido | Parser manual permissivo, sem limites/strictness; descarta papéis desconhecidos | Média | Substituir por schema Zod em `schemas/` e mapper explícito em `model/` |
| `model/permissions-rules.ts` | Ordenar papéis e derivar campos de tabela | Funções puras e legíveis; calcula filtros não usados e recebe row já derivada | Baixa | Mapear de um tipo de domínio enxuto para `PermissionTableRow`; remover derivados mortos |
| `model/permissions-types.ts` | Tipos da feature | Mistura wire, domínio e apresentação; duplica papéis do auth; `id` replica `key` | Média | Separar wire/schema, domínio e table row; compartilhar contrato canônico de papéis sem ciclo entre features |
| `routes/permissions-route.tsx` | Compor página, tabela e detalhes | Copy hardcoded, lógica de tabela/filtro na rota, sem empty states/persistência/aria label | Média | Reduzir à composição de `PermissionsTable`, seleção e `AppDetailsSheet` |
| `services/index.ts` | Reexportar gateway e serviço | Consumido apenas pelo root barrel | Baixa | Excluir |
| `services/permissions-gateway.ts` | Contrato, adapter Supabase, schema e composition root | Quatro responsabilidades; adapter não testável diretamente; API global mutável; erros 401/403 indistintos | Média | Dividir em `gateways/*`; manter setter/reset internos aos testes e schema dedicado |
| `services/permissions-service.ts` | Caso de uso de listagem | Fronteira correta, porém mero pass-through e sem invariantes | Baixa | Manter como caso de uso, validar paridade/duplicidade e mapear domínio |
| `table/index.ts` | Reexportar colunas | Barrel usado pela rota/root | Baixa | Excluir |
| `table/permissions-columns.tsx` | Definir colunas e ações | Estrutura clara; callback opcional permite controles sem efeito; largura/defaults não aplicados | Média | Tornar detalhes obrigatório quando houver ações; mover composição para `PermissionsTable` e testar semântica |

Todos os arquivos foram vistoriados; nenhum foi classificado automaticamente como removível apenas por nome. Exclusões propostas decorrem de ausência confirmada de consumidores ou de consolidação arquitetural.

## Segurança detalhada

| Risco | Avaliação |
| --- | --- |
| SQL injection | Não confirmado. Frontend e Edge Function usam nomes estáticos e o query builder Supabase, sem concatenação SQL |
| XSS | Não confirmado. React escapa labels/descrições e não há `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou URL construída com payload; ainda faltam limites defensivos de texto |
| CSRF | Risco baixo para esta leitura: `supabase.functions.invoke` usa bearer JWT e `verify_jwt = true`; CORS é aplicado. XSS continua capaz de agir em nome da sessão |
| Autorização em nível de função | Bypass confirmado no acesso direto ao catálogo: RLS verifica apenas usuário ativo, não `permissions.read` |
| Escalada de privilégio | Não foi encontrada escrita nesta feature; a divergência do catálogo restringe indevidamente admin em vez de ampliar seu acesso |
| Sessão revogada | O handler chama `getAuthenticatedActor`, que valida token e sessão ativa antes de consultar a matriz |
| Service role | Não aparece no bundle do browser; é criado somente na Edge Function depois de autenticação/autorização explícitas |
| Sanitização | Encoding de saída por React é adequado; validação semântica de wire é insuficiente e deve falhar fechada |
| Segredos/PII | A matriz não contém PII e os logs observados não incluem token; labels e estrutura de autorização continuam dados sensíveis operacionais |
| Auditoria | Não há evento de leitura/negação específico; decisão de compliance ainda não está formalizada |

O uso atual de `verify_jwt = true` está alinhado ao fluxo de chamada autenticada documentado pelo Supabase. A documentação mais recente também apresenta `@supabase/server`/`withSupabase` como composição oficial. Essa migração deve ser avaliada para todas as Edge Functions, nunca aplicada isoladamente a `list-permission-matrix` enquanto o projeto usa helpers compartilhados próprios.

## Performance e escalabilidade

### Evidência atual

- `app_roles`: 5 linhas, com RLS e `SELECT` de `authenticated` baseados apenas em usuário ativo;
- `app_permissions`: 17 linhas, aproximadamente 32 kB no banco local;
- `app_role_permissions`: 43 linhas, aproximadamente 48 kB;
- Edge Function: duas consultas paralelas, nenhum N+1;
- montagem da matriz: aproximadamente `O(permissões + vínculos + permissões × 5 papéis)`;
- tabela: paginação, filtros e ordenação locais são adequados para esse volume;
- chunk de produção de `permissions-route`: 8,58 kB, 3,38 kB gzip;
- orçamento global de bundle aprovado: 1.737.966 de 2.097.152 bytes.

### Ajustes proporcionais

1. Adicionar limite/sentinela defensivo às leituras da Edge Function e falhar em truncamento; não é necessário introduzir paginação cursor-based para 17 permissões.
2. Ordenar deterministicamente por label e chave.
3. Evitar enviar derivados que o cliente ignora.
4. Remover o hook de filtros morto e cálculos inalcançáveis.
5. Medir antes de alterar índices. O Advisor local marcou `app_role_permissions_permission_key_idx` como não usado, mas o banco local reiniciado não representa carga produtiva e o índice auxilia o lado referenciante da FK/cascade. Não removê-lo por esse sinal isolado.
6. Se o catálogo crescer para centenas/milhares de capabilities, migrar filtro/paginação para contrato server-side; isso não é necessário no volume atual.

## Acessibilidade, responsividade e inclusão

Pontos fortes herdados da camada compartilhada:

- DataTable possui caption para leitor de tela, `aria-rowcount`, `aria-colcount`, loading anunciado e container horizontal rolável;
- texto clicável usa `<button>` com foco visível;
- coluna de ações possui cabeçalho somente para leitor de tela;
- AppDetailsSheet recebe título e descrição condicionais;
- acesso não depende exclusivamente de cor porque cada ícone recebe um nome acessível.

Pendências específicas:

- fornecer `ariaLabel` específico, em vez de “Tabela de dados”;
- usar `AppEmptyState` para vazio inicial e vazio filtrado;
- aplicar defaults/persistência de colunas para reduzir largura em telas estreitas;
- validar se a repetição de dezenas de SVGs nomeados produz uma leitura aceitável; preferir wrapper semântico e ícone decorativo;
- exibir a chave técnica integral;
- testar busca, filtro, view options, paginação, menu de ações, abertura/fechamento do sheet, retorno de foco e Escape somente por teclado;
- validar 320/390/768/1024 px, zoom de 200%, alto contraste e leitor de tela humano.

Não há evidência de falha responsiva confirmada porque a sessão não disponibilizou navegador. A rolagem horizontal no componente compartilhado reduz o risco, mas não substitui o teste real.

## Dependências e compatibilidade

| Dependência | Versão declarada | Uso | Avaliação em 2026-08-01 |
| --- | --- | --- | --- |
| React | `^19.2.7` | hook, memoização e composição | necessária; patch 19.2.8 disponível |
| Supabase JS | `^2.111.0` | invocação da Edge Function | necessária; não apareceu como desatualizada |
| Zod | `^4.4.3` | schema superficial do invoke | necessária e deve assumir todo o wire contract; não apareceu como desatualizada |
| TanStack Table | `^8.21.3` | tipos/infra da DataTable | necessária indiretamente; não apareceu como desatualizada |
| Lucide React | `^1.22.0` | ícones de acesso | necessária; atualização minor 1.28.0 disponível |
| shadcn/radix/base-ui | primitives compartilhadas | tabela, sheet, badge e controles | necessárias indiretamente; não editar internals para esta refatoração |

`pnpm audit --prod --audit-level high` não encontrou vulnerabilidades conhecidas. O `pnpm outdated` também listou atualizações globais patch/minor e majors de ferramentas (`typescript`, `jsdom`, `@testing-library/jest-dom`); elas devem ser tratadas em commits separados, não misturadas à refatoração de permissions.

Compatibilidade verificada:

- TypeScript da aplicação e dos testes: aprovado;
- ESLint focado: aprovado;
- Deno 2.8.2: `deno check` aprovado para `list-permission-matrix`;
- Supabase CLI 2.111.0: banco local acessível;
- build Vite 8.1.0: aprovado.

## Arquitetura-alvo

```text
src/features/permissions/
├── components/
│   ├── permission-access-icon.tsx
│   └── permissions-table.tsx
├── constants/
│   ├── permissions-copy.ts
│   └── permissions-persistence.ts
├── gateways/
│   ├── permissions-gateway-contracts.ts
│   ├── permissions-gateway.ts
│   └── supabase-permissions-gateway.ts
├── hooks/
│   └── use-permissions.ts
├── model/
│   ├── permissions-details.tsx
│   ├── permissions-models.ts
│   └── permissions-types.ts
├── routes/
│   └── permissions-route.tsx
├── schemas/
│   └── permissions-gateway-schema.ts
├── services/
│   └── permissions-service.ts
├── table/
│   ├── permissions-columns.tsx
│   └── permissions-filter-options.ts
└── README.md
```

Princípios:

- rota compõe; componente apresenta; hook orquestra React; serviço executa caso de uso; gateway faz I/O; schema valida wire; model contém regras puras;
- `PermissionWireRow`, `Permission`, `PermissionTableRow` e configuração de filtro não são o mesmo tipo;
- sem barrels internos;
- sem `index.ts` público enquanto não existir consumidor entre features;
- memória/factories de teste ficam em `tests/helpers`, nunca como fallback produtivo;
- nenhuma cópia de `DataTable` ou wrapper por papel;
- `src/components/ui` permanece intocado.

## Plano recomendado de implementação

### Onda 1 — corrigir autorização e catálogo

1. Criar migration aditiva para revogar acesso direto ou exigir `permissions.read`.
2. Restaurar `prices.manage` e `rules.manage` na fonte ativa conforme matriz aprovada.
3. Remover ou restaurar formalmente `clients.sync.read`; a recomendação é remover se o histórico de sync continuar excluído.
4. Definir fonte canônica para grupo/origem/criticidade ou remover esses conceitos da tela.
5. Criar contratos SQL que falhem se catálogo, grants, policies, wildcard ou papéis divergirem.
6. Validar owner/admin/auditor/manager/operator e sessão revogada no banco local real.

### Onda 2 — alinhar arquitetura

1. Criar `gateways/` e `schemas/`.
2. Separar contrato, composition root e adapter Supabase.
3. Separar wire, domínio e table row.
4. Extrair `PermissionsTable` e opções de filtro.
5. Remover os cinco nested barrels e, se continuar sem consumidor externo, o root barrel.
6. Consolidar documentação em `README.md` e excluir os dois arquivos internos obsoletos.

### Onda 3 — integridade assíncrona e UI

1. Aplicar generation guard e preservar snapshot válido no retry.
2. Centralizar toda copy.
3. Aplicar nome acessível, vazio, vazio filtrado e persistência de colunas.
4. Exibir chave técnica exata.
5. Remover filtros/campos mortos ou torná-los funcionais a partir de dados canônicos.
6. Tornar callbacks de ações observáveis e obrigatórios.

### Onda 4 — Edge Function e observabilidade

1. Extrair montagem pura da matriz e testá-la com Deno.
2. Validar limites e retorno estrito; remover payload redundante.
3. Corrigir códigos HTTP de falhas inesperadas.
4. Adicionar correlation ID e política de logs redigidos.
5. Avaliar `@supabase/server` como decisão transversal de Edge Functions, não como desvio isolado.

### Onda 5 — testes e rollout

1. Adicionar testes de schema, adapter, service, hook, tabela, rota, função e banco.
2. Executar reset local das migrations, contratos e Advisors.
3. Executar comparação remota somente leitura após autorização específica.
4. Validar em navegador autenticado, mobile, axe e teclado.
5. Manter commits separados para migration, arquitetura, UI, testes e documentação.

## Casos de teste e critérios de aceite

### Catálogo e banco

- paridade exata entre capabilities aprovadas, `app_permissions`, `app_role_permissions` e auth profile;
- `prices.manage` e `rules.manage` com papéis formalmente aprovados;
- decisão explícita e testada para `clients.sync.read`;
- manager/operator não consultam a matriz diretamente nem pela Edge Function;
- owner/admin/auditor acessam conforme a matriz aprovada;
- wildcard concede acesso sem duplicar linhas;
- sessão revogada falha mesmo com JWT ainda válido;
- grants residuais e policies divergentes fazem o teste SQL falhar.

### Edge Function e adapter

- método diferente de POST: 405;
- token ausente/inválido ou sessão revogada: 401;
- papel sem `permissions.read`: 403;
- dependência indisponível: 503;
- payload inválido: 502 ou contrato equivalente;
- exceção inesperada: 500;
- resposta válida, vazia, truncada, duplicada e com papel desconhecido;
- ausência do cliente Supabase e erro de invoke não produzem dados sintéticos.

### React e DataTable

- carregamento inicial, refetch com dados existentes, erro bloqueante e não bloqueante;
- resposta antiga nunca sobrescreve a mais nova;
- unmount não atualiza estado;
- vazio e vazio filtrado distintos;
- busca por chave/label/grupo e filtros aprovados;
- visibilidade persistida e resetável;
- chave técnica exibida integralmente;
- todos os botões têm efeito observável;
- teclado, Escape, retorno de foco, nomes acessíveis, zoom e viewports aprovados.

### Gates finais

- ESLint completo;
- TypeScript da aplicação e testes;
- testes focados e suite completa sem timeout/skip/only;
- build e orçamento de bundle;
- Deno check e testes da Edge Function;
- reset das migrations, lint, contratos RLS e Advisors;
- auditoria de dependências;
- `git diff --check`;
- documentação e inventário forense atualizados.

## Validações executadas nesta revisão

| Verificação | Resultado |
| --- | --- |
| Inventário de `permissions` | 22/22 arquivos vistoriados |
| ESLint focado | Aprovado |
| TypeScript da aplicação | Aprovado |
| TypeScript dos testes | Aprovado |
| Testes focados | 3 arquivos / 7 testes aprovados; 49,37 s total, 1,76 s nos testes |
| Deno check da Edge Function | Aprovado |
| Supabase DB lint local | Aprovado, sem erros de schema |
| Contratos SQL globais | Aprovados por execução direta no `psql` local |
| Supabase Advisors local | Sem erro/warning; somente infos globais de índices não utilizados |
| Banco local | 17 permissões, 43 vínculos, 0 órfãos e 0 linhas-base inválidas |
| Auditoria de produção | Nenhuma vulnerabilidade conhecida |
| Build | Aprovado; chunk permissions 8,58 kB / 3,38 kB gzip |
| Orçamento de bundle | Aprovado |
| `pnpm validate` | Aprovado; 790 arquivos, 466 fontes e 63 migrations |
| `git diff --check` | Aprovado |
| Navegador | Não executado: nenhum navegador disponível na sessão |
| Banco remoto | Não inspecionado nesta etapa |

## Referências analisadas

### Internas

- `src/features/users/README.md`;
- `src/features/audit/README.md`;
- `src/features/clients/README.md`;
- `src/features/units/README.md`;
- `src/app/router/route-registry.ts`;
- `src/features/auth/contracts/auth-contracts.ts`;
- `src/features/auth/authorization/authorization-policy.ts`;
- `src/components/data-table/*` e `src/components/shared/app-details-sheet.tsx`;
- `supabase/functions/list-permission-matrix/index.ts`;
- `supabase/functions/_shared/auth-context.ts` e `auth-responses.ts`;
- `supabase/config.toml`;
- migrations `20260710043000`, `20260713170614`, `20260715002310`, `20260720213000`, `20260721104050`, `20260727120000` e `20260801131336`;
- `supabase/tests/security-contracts.sql`;
- `tests/features/permissions/*`, `tests/setup.ts`, `package.json` e lockfile.

### Oficiais

- [Supabase — Securing Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Function configuration](https://supabase.com/docs/guides/functions/function-configuration)
- [Supabase — Testing Edge Functions](https://supabase.com/docs/guides/functions/unit-test)
- [Supabase — Changelog de Edge Functions](https://supabase.com/changelog?tags=edge+functions)
- [React — useEffect e prevenção de race conditions](https://react.dev/reference/react/useEffect)
- [shadcn/ui — Data Table](https://ui.shadcn.com/docs/components/data-table)

## Decisões que precedem qualquer implementação

1. Confirmar que a matriz será acessível exclusivamente pela Edge Function — recomendado.
2. Confirmar papéis de `prices.manage` e `rules.manage` — a evidência histórica aponta owner/admin.
3. Confirmar exclusão definitiva ou restauração de `clients.sync.read` — exclusão é recomendada se a UI de sync não voltar.
4. Decidir se origem e criticidade permanecem; se permanecerem, devem ser dados canônicos.
5. Definir se consultas/negações da matriz exigem evento de auditoria ou apenas log correlacionado.

Nenhuma dessas decisões foi aplicada nesta revisão.
