# Usuários — auditoria forense e arquitetura

Data da revisão: 1º de agosto de 2026.

## Escopo e resultado

Este documento registra a auditoria individual de todos os arquivos de produção em `src/features/users` e dos testes diretamente associados. O objetivo foi transformar a feature em uma referência replicável para páginas com tabela, filtros, paginação, detalhes e ações administrativas, sem alterar `src/components/ui` nem auditar outras features.

A implementação produtiva continua usando Supabase. Gateways em memória existem apenas no ambiente de teste por injeção explícita. A revisão removeu unidades fictícias da rota, duplicação de formulários e detalhes, ações administrativas invisíveis, validação enganosa de senha na edição, barrels internos e documentação obsoleta.

Nenhum arquivo de `components/ui` foi alterado. A validação integrada no navegador revelou uma falha de permissão na RPC de perfil que impedia a sessão autenticada de carregar; ela foi corrigida por migration aditiva, sem ampliar privilégios públicos. A feature foi validada contra o Supabase local real com o usuário owner, e não apenas contra fixtures.

## Funcionalidades cobertas

- listagem de usuários com busca global, paginação e persistência da visibilidade de colunas;
- filtros por perfil, status, unidade e acesso recente;
- estados de carregamento inicial, erro com nova tentativa, vazio e vazio filtrado;
- detalhes com CPF e telefone tratados pelo componente compartilhado de dados sensíveis;
- cadastro e edição com validação sintática e semântica;
- bloqueio/desbloqueio, remoção de bloqueio temporário, redefinição de senha, reset de passkey e revogação de sessões;
- autorização visual por permissão, papel do ator, identidade do alvo e prevenção de autogerenciamento;
- aba de solicitações de acesso somente para quem possui `access_requests.read`;
- atualização otimista apenas depois de resposta confirmada e releitura autoritativa do backend;
- mensagens previsíveis sem exposição de detalhes técnicos da Edge Function.

Exportação de usuários permanece desabilitada porque a tabela contém dados pessoais. Qualquer futura exportação exige autorização própria, trilha de auditoria, escopo de campos e política de retenção.

## Fluxo de dados canônico

```text
UsersRoute
  -> UsersTable / UserFormDialog / UserAdminActionDialog
  -> useUsers
  -> users-service
  -> UsersGateway
  -> Supabase Data API / RPC / Edge Functions
  -> schemas Zod de wire
  -> UserRecord de domínio
  -> DataTable e detalhes
```

### Leitura

1. `useUsers` solicita um snapshot ao serviço.
2. O serviço inicia usuários e catálogo de unidades em paralelo.
3. O gateway inicia, também em paralelo, `app_users`, último acesso e fatores de autenticação.
4. Respostas externas são validadas por Zod antes de entrar no domínio.
5. `Map` é usado para associar último acesso, passkeys e nomes de unidade em tempo linear.
6. Falha no núcleo de usuários bloqueia a tabela. Falha somente no catálogo de unidades preserva a consulta, mas impede silenciosamente que uma unidade inventada seja usada.

### Cadastro e edição

1. O formulário valida formato, limites, papel e obrigatoriedade de unidade/senha.
2. O serviço repete a validação; a UI não é tratada como fronteira de segurança.
3. CPF e telefone são normalizados para dígitos.
4. Para perfis locais, `unitId` precisa existir no catálogo real. `unitName` não cruza a fronteira de comando e é hidratado somente a partir do backend.
5. A Edge Function recebe o comando e aplica autenticação, autorização e persistência.
6. O resultado contém identidades; o serviço relê o usuário persistido antes de atualizar a tabela.

Senha de primeiro acesso existe apenas no cadastro. A edição não oferece nem envia senha, evitando a antiga aparência de sucesso sem efeito.

### Ações administrativas

1. `users.manage` libera a capacidade geral na interface.
2. A política local espelha a política do backend: owner gerencia outro usuário; admin não gerencia owner; ninguém gerencia a si mesmo; alvos sem identidade Auth não recebem ações.
3. A linha já carrega `authUserId`, evitando uma consulta de identidade antes da mutação.
4. A Edge Function permanece a autoridade final e grava sucesso ou negação em `audit_events`.
5. A UI mostra somente mensagem segura e mantém falhas de mutação separadas do erro de carregamento da tabela.

## Baseline para páginas com DataTable

O padrão extensível desta feature é:

- rota como controlador e composição de página, sem acesso direto ao Supabase;
- componente de tabela específico apenas para colunas, filtros e estados da entidade;
- `DataTable` compartilhada como única implementação de busca, filtros, paginação, preferências e estados;
- factory de colunas e factory de ações de linha puras e testáveis;
- modelos puros para labels, normalização e política;
- hook para estado React e concorrência;
- serviço para caso de uso e validação semântica;
- gateway para I/O e adapter de wire;
- schemas distintos para formulário e respostas externas;
- somente um `index.ts` público, com superfície mínima exigida por consumidores externos.

Outras features devem reutilizar esse arranjo conceitual, não copiar arquivos nem criar um novo wrapper genérico por entidade.

## Segurança

### Controles confirmados

| Risco | Evidência e avaliação |
|---|---|
| SQL injection | Não há SQL montado por concatenação. Filtros usam o query builder Supabase e nomes de tabela, RPC, select e Edge Functions são constantes estáticas. Valores seguem separados do comando. |
| XSS | Dados externos são renderizados como children React; não há `dangerouslySetInnerHTML`, `innerHTML`, `eval` ou URL construída com entrada do usuário nesta feature. Texto livre não é mutilado por blacklist; validação e codificação de saída continuam responsabilidades complementares. |
| CSRF | Mutações usam `supabase.functions.invoke`, que envia o JWT no header de autorização, e as oito funções administrativas estão com `verify_jwt = true`. CORS/origin e autorização do handler continuam obrigatórios no backend. XSS ainda pode contornar controles de CSRF e precisa ser evitado. |
| Entrada adulterada | Formulário e serviço usam Zod; CPF, telefone, e-mail, senha, papel, limites e escopo de unidade são validados. Respostas do Supabase também passam por schemas de wire. |
| Escalada de privilégio | A UI aplica `users.manage` e política ator/alvo para usabilidade. A Edge Function revalida sessão, status, papel, alvo e autogerenciamento; controles do cliente nunca são considerados suficientes. |
| Dados sensíveis | Não existe chave service-role no browser, exportação está ausente e não há `console.log` com PII. CPF e telefone usam apresentação compartilhada de dado sensível. |
| Auditoria | A infraestrutura administrativa compartilhada registra ator, alvo, evento, sucesso e metadados em `audit_events`, inclusive negações. |
| Erros | Respostas técnicas ficam em `cause`; a interface recebe copy estável. Falha remota não produz toast de sucesso nem fallback sintético. |

Referências internas verificadas: [`supabase/config.toml`](../../../supabase/config.toml), [`admin-users.ts`](../../../supabase/functions/_shared/admin-users.ts), [`auth`](../auth) e [`DataTable`](../../components/data-table).

### Limites de segurança restantes

- validação definitiva de payload, papel, unidade e estado precisa continuar nas Edge Functions; JavaScript do cliente pode ser contornado;
- o reset local e os contratos de sessão/RLS passaram; testes negativos individualizados das oito Edge Functions administrativas continuam necessários para cobrir cada combinação de papel e alvo;
- a telemetria do frontend ainda não oferece correlation/request ID. Não foram adicionados logs locais para evitar vazamento de PII;
- a aba importada de `access-requests` é permissionada, mas mantém acoplamento de composição entre duas features;
- a visibilidade de CPF/telefone deve ser revista sempre que a matriz de permissões mudar.

## Acessibilidade e inclusão

- formulário usa `Field`, `FieldGroup`, `FieldDescription`, `FieldError`, `aria-invalid`, `aria-required` e `aria-describedby`;
- após validação, o primeiro controle inválido recebe foco;
- Dialog, Sheet e AlertDialog têm título e descrição;
- ações destrutivas exigem confirmação, expõem estado pendente e bloqueiam fechamento concorrente;
- nome clicável vira texto comum quando detalhes não estão disponíveis;
- acesso recente não depende apenas de cor: há texto para leitor de tela e coluna filtrável;
- ícones decorativos têm `aria-hidden`; ícones em botões usam `data-icon`;
- SelectItem fica dentro de SelectGroup e o Combobox usa a composição shadcn instalada;
- estados vazio, erro e carregamento usam componentes compartilhados e mantêm nomes acessíveis.

Além dos testes de associação de erro e foco, a rota autenticada foi exercitada em navegador desktop e em viewport de 390 × 844. A varredura automatizada não encontrou violações de acessibilidade, o console ficou sem erros ou warnings da aplicação e o overflow permaneceu restrito ao container rolável da tabela. Leitor de tela humano e matriz completa de navegadores continuam como validação complementar.

## Desempenho e concorrência

### Melhorias aplicadas

- chamadas independentes são paralelas;
- joins em memória usam `Map`, evitando buscas quadráticas;
- colunas e opções de filtros são memoizadas;
- o alvo da ação administrativa vem da linha, removendo a releitura integral anterior à mutação;
- mutações usam mutex para impedir duplo envio;
- gerações de carregamento impedem resposta antiga de sobrescrever uma mais recente;
- paginação, filtros e preferências permanecem na DataTable compartilhada.

### Gargalo restante

A leitura ainda busca todos os usuários, todos os últimos acessos e todos os fatores antes de paginar no cliente. O custo é O(n) em rede e memória e não escala indefinidamente. Quando o volume justificar, a solução deve ser um read model paginado no backend que aplique busca/filtros e devolva contagens, sem expor fatores além do necessário. Essa alteração exige contrato/migration/Edge Function fora desta onda.

## Dependências e compatibilidade

| Dependência declarada | Versão | Uso em `users` | Avaliação |
|---|---:|---|---|
| React | `^19.2.7` | estado, memoização, efeitos e IDs acessíveis | necessária |
| React Router | `^8.3.0` | estado da aba por query string | necessária e já na versão que corrigiu o advisory anterior |
| TanStack Table | `^8.21.3` | tipos de colunas via DataTable | necessária |
| Zod | `^4.4.3` | formulário, comandos e wire payloads | necessária |
| Supabase JS | `^2.111.0` | cliente Data API/RPC/Functions por `lib/supabase-browser` | necessária |
| Lucide React | `^1.22.0` | ícones tipados | necessária |
| Radix/shadcn | `radix-ui ^1.6.0` e primitives locais | foco, Dialog, Sheet, Select e AlertDialog | necessária indiretamente |

`react-hook-form` e `@hookform/resolvers` não são mais usados por esta feature, mas são dependências globais com consumidores fora do escopo; esta auditoria não autoriza removê-los.

Em 31/07/2026, `pnpm outdated` indicou patches/minors disponíveis para React, Lucide, Radix e ferramentas, além de majors para Testing Library DOM, jsdom e TypeScript. Upgrades não foram misturados a esta refatoração comportamental. `pnpm audit --prod --audit-level high` não encontrou vulnerabilidades conhecidas.

A feature pressupõe browser moderno do aplicativo Vite. Datas inválidas degradam para offline/label de fallback; respostas produtivas devem continuar em ISO 8601. O acesso a `window` ocorre em hook React no cliente, não durante avaliação de domínio.

## Inventário forense por arquivo

| Arquivo | Responsabilidade | Achado e decisão |
|---|---|---|
| `README.md` | Documento normativo da feature | Novo; substitui dois documentos curtos e defasados no antigo diretório `docs`. |
| `components/user-admin-action-dialog.tsx` | Confirmação única para cinco ações administrativas | Novo; elimina dialogs duplicados. Vistoriado, sem achado pendente. |
| `components/user-details-sheet.tsx` | Adaptação de usuário para o Sheet compartilhado | Duplicação da rota removida. Vistoriado, sem achado pendente. |
| `components/user-form-dialog.tsx` | Estado, submissão, erro seguro e foco do formulário | Formulário duplicado e vazamento de mensagem técnica removidos; primeiro inválido recebe foco. |
| `components/user-form-fields.tsx` | Campos pessoais e de escopo, composição shadcn e ARIA | Unidades fictícias removidas; erros associados aos controles; senha só no cadastro. Coeso, embora extenso pela marcação semântica de seis campos; dividir apenas se novos grupos surgirem. |
| `components/users-table.tsx` | Configuração visual da tabela, filtros e estados | Novo; retira apresentação da rota e preserva uma única DataTable genérica. |
| `constants/users-api.ts` | Nomes estáticos de fontes, funções e selects | Novo; remove strings operacionais espalhadas. |
| `constants/users-copy.ts` | Copy centralizada | Textos duplicados removidos dos componentes. Futuro i18n deve substituir este módulo, não voltar a strings locais. |
| `constants/users-persistence.ts` | Chaves de tabela e tabs | Chaves de cache/form sem consumidor removidas. Vistoriado, sem achado pendente. |
| `gateways/supabase-users-gateway.ts` | I/O produtivo e adapter Supabase → domínio | Separado de schemas/contratos; valida wire, converte respostas de mutação em identidades de domínio e paraleliza fontes. Candidato a separar leitura/escrita somente se crescer. |
| `gateways/users-gateway-contracts.ts` | Portas e comandos de I/O | Novo; permite memory gateway apenas por injeção em testes. Vistoriado, sem achado pendente. |
| `gateways/users-gateway.ts` | Seleção do gateway produtivo/teste | Pequeno composition root; padrão explícito sem fallback sintético em produção. |
| `hooks/use-users.ts` | Estado assíncrono, concorrência e mutações React | Fluxos duplicados e erros misturados removidos; mutex e generation guard adicionados. |
| `index.ts` | Único barrel público | Reduzido aos símbolos usados por `units` e testes; nested barrels excluídos. |
| `model/users-admin-actions.ts` | Apresentação pura das ações | Novo; centraliza título, copy, tom e feedback. Vistoriado, sem achado pendente. |
| `model/users-admin-policy.ts` | Política pura ator/alvo e papéis atribuíveis | Novo; espelha backend e é coberto por testes. Backend segue autoritativo. |
| `model/users-models.ts` | Labels, detalhes, presença e escopo de unidade | Remove ID artificial, torna catálogo real a fonte canônica da unidade e rejeita timestamps futuros como “acesso recente”. |
| `model/users-types.ts` | Tipos de domínio e comandos públicos | Tipos/papéis/status duplicados agora reutilizam o contrato público de `auth`. |
| `routes/users-route.tsx` | Controlador e composição da página | Reduzido de rota monolítica para autenticação, tabs e coordenação; UI duplicada removida. |
| `schemas/users-form-schema.ts` | Schema de formulário/comando e mapeamento de erros | Extraído do gateway/model; preserva o primeiro erro por campo e separa create/edit. |
| `schemas/users-gateway-schemas.ts` | Schemas de respostas externas | Contratos estritos para leitura e mutações; UUIDs, papéis, status, fatores e identidades inválidas falham de forma fechada. |
| `services/users-service.ts` | Casos de uso, validação semântica e hidratação | Catálogo real, validação em profundidade e releitura autoritativa; nenhuma regra React/Supabase visual. |
| `table/users-columns.tsx` | Colunas e células específicas | Ações antes inatingíveis corrigidas; acesso recente acessível e classes semânticas. `last_sign_in_at` não é apresentado como presença online real. |
| `table/users-filter-options.ts` | Opções derivadas de filtros | Agora cobre papel, status, unidade e online sem listas fictícias. |
| `table/users-row-actions.ts` | Factory pura de ações por linha | Novo; regras de disponibilidade isoladas e testadas. |
| `table/users-table-ids.ts` | ID tipado da coluna calculada | Novo; evita string solta para o filtro de acesso recente. |

Arquivos removidos após confirmação de alcance: `constants/index.ts`, `model/index.ts`, `table/index.ts`, `model/users-validation.ts`, `services/users-gateway.ts`, `docs/README.md` e `docs/VALIDATION.md`. Os diretórios vazios `docs` e `types` também foram eliminados. O conteúdo útil foi migrado; os nested barrels e contratos antigos não tinham finalidade normativa.

## Testes associados

| Teste | Cobertura |
|---|---|
| `user-form-dialog.test.tsx` | falha remota segura, dialog permanece aberto e mensagem técnica não vaza |
| `users-route.test.tsx` | tabela/detalhes sem IDs crus, validação/foco/ARIA, cadastro e aba de solicitações |
| `users-service.test.ts` | unidade canônica, senha forte, bloqueio pré-gateway, identidade sem consulta extra e degradação do catálogo |
| `users-form-schema.test.ts` | prioridade de erros obrigatórios e ausência de senha na edição |
| `users-admin-policy.test.ts` | matriz owner/admin, autogerenciamento e alvo sem Auth |
| `users-row-actions.test.ts` | ações visíveis para alvo autorizado e não autorizado |
| `users-models.test.ts` | janela de acesso recente, timestamp inválido e nomenclatura sem falsa presença |
| `users-gateway-schemas.test.ts` | aceitação do wire esperado e rejeição de UUID/passkey inválidos |
| `supabase-users-gateway.test.ts` | queries reais mockadas na fronteira, mapeamento wire → domínio e respostas de mutação |
| `use-users.test.tsx` | concorrência, descarte de resposta obsoleta e estado de mutação do hook |

Os gateways em memória ficam em `tests/helpers`, nunca no bundle produtivo. O setup global apenas injeta esses gateways durante Vitest.

### Resultado dos gates em 01/08/2026

| Gate | Resultado |
|---|---|
| ESLint global | passou |
| TypeScript da aplicação | passou |
| TypeScript dos testes | passou |
| Testes focados de `users` | 10 arquivos e 30 testes passaram; a execução combinada `users` + `audit` aprovou 16 arquivos / 50 testes |
| Testes completos | 77 arquivos e 269 testes passaram em 445,26 s |
| Build de produção | passou; 913 módulos e chunk lazy de usuários com 34,04 kB, 10,04 kB gzip |
| Orçamento de bundle | passou; 1.741.693 bytes de assets para limite de 2.097.152 |
| Auditoria de produção | passou; nenhuma vulnerabilidade conhecida |
| Supabase local | reset integral, lint e contratos de segurança/cron passaram |
| Supabase remoto | lint sem erro e 62 migrations pareadas com o repositório |
| Navegador autenticado | rota real carregada, console sem erro e axe com zero violações |
| `git diff --check` | passou |
| `pnpm validate` | passou; 794 arquivos, 471 fontes e 62 migrations inventariados |

O validador raiz foi atualizado para verificar os contratos atuais em vez de procurar identificadores removidos em posições históricas. Nenhum shim ou código morto foi reintroduzido para satisfazer busca textual.

Comandos de aceite:

```powershell
pnpm eslint src/features/users tests/features/users tests/helpers/users-memory-gateway.ts tests/setup.ts
pnpm typecheck
pnpm typecheck:test
pnpm vitest run tests/features/users --reporter=dot
pnpm validate
pnpm test -- --reporter=dot
pnpm build
git diff --check
```

## Achados remanescentes e próximas ondas

1. Criar read model paginado quando métricas reais demonstrarem pressão de rede/memória.
2. Executar testes negativos de cada Edge Function e RLS em Supabase local resetado; não simular aprovação no frontend.
3. Acrescentar observabilidade com request/correlation ID e redaction central, sem logar CPF, telefone, e-mail, token ou senha.
4. Decidir se solicitações de acesso permanecem como tab desta rota ou ganham composição própria; a feature importada não foi refatorada aqui.
5. Executar testes de teclado/leitor de tela em navegador real e estabelecer orçamento de acessibilidade no CI.
6. Avaliar atualizações de dependências em commit próprio após changelog e suíte completa, sem misturar com comportamento.

## Referências oficiais analisadas

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase — Securing Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Supabase — Function configuration](https://supabase.com/docs/guides/functions/function-configuration)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OWASP — Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP — Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP — Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [React — Common components e `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common)
- [React — input](https://react.dev/reference/react-dom/components/input)
- [shadcn/ui — Field](https://ui.shadcn.com/docs/components/radix/field)
- [shadcn/ui — Dialog](https://ui.shadcn.com/docs/components/radix/dialog)
- [shadcn/ui — Alert Dialog](https://ui.shadcn.com/docs/components/radix/alert-dialog)
- [shadcn/ui — Data Table](https://ui.shadcn.com/docs/components/data-table)
