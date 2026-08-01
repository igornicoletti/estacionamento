# Auditoria forense e execução do plano de modernização

Data de corte: 2026-07-31
Escopo: worktree local `shadcn-data-table-generic`
Modo: implementação local, sem staging, commit, push, deploy, migration remota ou escrita em ambiente Supabase remoto

## Resumo executivo

A primeira onda de integridade produtiva e a segunda onda estrutural foram implementadas. Os quatro fluxos que simulavam sucesso produtivo — clientes, auditoria, permissões e usuários — agora dependem de gateways Supabase/Edge reais. Gateways em memória existem apenas em `tests/` e são configurados explicitamente pelo setup. Dashboard, Relatórios e Pátio foram classificados como previews de desenvolvimento e deixaram o registro/navegação produtivos. A refatoração local da DataTable foi preservada e integrada sem customizar o Combobox gerado.

Também foram fixados pnpm, Node, Deno e ferramentas executadas por `npx`; `react-router` foi atualizado para 8.3.0; variáveis públicas foram separadas dos segredos; o domínio WebAuthn canônico passou a ser `estacionamento.redemontecarlo.com.br`; configurações TypeScript/ESLint e tokens globais foram saneados; utilitários e wrappers inequivocamente mortos foram removidos.

O inventário individual está disponível em:

- `docs/audits/2026-07-31-forensic-file-inventory.csv`;
- `docs/audits/2026-07-31-forensic-file-inventory.json`.

Cada arquivo de propriedade do projeto possui caminho, categoria, estado Git, status da vistoria, achado, severidade, ação, justificativa, testes e referência. Locks, migrations, binários, assets e primitives shadcn têm classificação própria. O gerador determinístico fica em `scripts/generate-forensic-inventory.mjs`.

## Preservação e limites

- Nenhum `git reset`, checkout destrutivo ou staging global foi executado.
- Os 8 arquivos modificados e 4 arquivos novos da refatoração original da DataTable foram preservados e revisados por diff.
- Nenhuma migration histórica foi reescrita.
- Nenhuma exclusão de primitive shadcn ou dependência associada foi feita por resultado automático de Knip.
- Nenhum segredo real foi lido ou registrado.
- Nenhuma inspeção ou mutação remota foi executada.
- O snapshot `auth-phase-1-current-state.zip` foi comparado por inventário com o código versionado e removido por ser um artefato histórico reproduzível, sem finalidade normativa. O conteúdo continua recuperável pelo histórico Git.

## Mudanças implementadas

### Integridade produtiva

| Contrato | Antes | Implementação atual | Proteção contra falso sucesso |
|---|---|---|---|
| Clientes | serviço retornava fixtures e ignorava o gateway existente | `clients-service.ts` consome exclusivamente `getClientsGateway()` | falha do gateway rejeita o caso de uso |
| Auditoria | eventos sempre simulados | novo `AuditGateway` consulta `audit_events`, valida com Zod e normaliza o domínio | não existe fallback produtivo |
| Permissões | matriz local mascarava falha da função protegida | novo `PermissionsGateway` invoca `list-permission-matrix` e valida a resposta | erro/autorização são propagados |
| Usuários | gateway default inteiramente em memória | gateway default lista `app_users`, unidades, último acesso e fatores; mutações invocam Edge Functions administrativas | sucesso só ocorre após resposta remota; memória fica em `tests/helpers` |

O enriquecimento do catálogo de unidades na listagem de usuários é não bloqueante porque é informação auxiliar. A indisponibilidade do catálogo não converte escopo desconhecido em “Global”: o identificador real é preservado como rótulo degradado.

### Disponibilidade de rotas

O registro ganhou `availability: "development"`. Relatórios e Pátio são filtrados em produção. O Dashboard continua disponível como preview em desenvolvimento, enquanto `/` carrega um redirect mínimo para `/unidades` no build produtivo. Um teste de contrato cobre a decisão de disponibilidade.

Essa mudança não cria backend, tabela ou API. Ela torna indisponibilidade explícita e impede que mocks/placeholders sejam tratados como recursos operacionais.

### DataTable e shadcn

- Filtros recebem `icon?: LucideIcon`; a heurística por string foi removida.
- Ícones usam `data-icon` e tamanho centralizado.
- Itens do Dropdown Menu foram agrupados corretamente.
- O divisor manual do filtro de pesquisa foi substituído por `Separator`.
- O Combobox usa o indicador oficial; propriedades locais `showIcon`/`showIndicator` foram removidas.
- `src/components/ui/combobox.tsx` não possui diff contra `HEAD`.
- Contratos de loading, vazio, filtro, paginação e persistência existentes foram preservados.

Referências de composição: [Field](https://ui.shadcn.com/docs/components/radix/field), [Dialog](https://ui.shadcn.com/docs/components/radix/dialog), [Empty](https://ui.shadcn.com/docs/components/radix/empty), [Dropdown Menu](https://ui.shadcn.com/docs/components/radix/dropdown-menu) e [Select](https://ui.shadcn.com/docs/components/radix/select).

### Deduplicação e legados confirmados

- `isRenderable` tornou-se helper único e substituiu seis implementações locais em shells compartilhados.
- `src/lib/promise.ts` foi removido depois de busca de alcance sem consumidores.
- `AppResponsiveDialogDrawer` e seu export foram removidos depois de confirmação de ausência de consumidores.
- `src/features/users/types/users-types.ts`, que apenas reexportava `model`, foi removido; os testes usam o contrato canônico.
- O normalizador operacional dormente e seus tipos/formatters sem consumidores foram substituídos por uma especificação de evidências em `docs/architecture/operations-read-model.md`; somente o formatter ainda consumido pelos previews foi mantido.
- `public/favicon.svg` tornou-se a fonte canônica do símbolo da marca; a cópia byte a byte em `src/assets` foi removida e o sidebar referencia o asset público.
- O ignore ESLint de `src/hooks/use-mobile.ts` foi removido e o arquivo passa no lint.
- Prettier foi removido porque não havia configuração/política adotada; nenhuma reformatação massiva foi misturada às mudanças funcionais.
- Vinte e cinco barrels sem consumidor foram removidos. O validador agora falha se um novo `index.ts` de feature não tiver alcance comprovado.
- Testes soltos foram realocados para `tests/features/<feature>/`, e o validador impede regressões para `tests/auth/` ou para a raiz de `tests/features/`.
- `docs/data-table-filter-refactor.md` foi movido para `docs/current/`; arquitetura, auditorias, documentação vigente e relatórios possuem índices próprios. A raiz de `docs/` aceita somente `README.md`.
- A feature genérica `src/features/sync`, seus runners e a UI/histórico duplicados em clientes/unidades foram removidos após a confirmação de ausência de consumidores. Os serviços reais que disparam `clients-sync` e `units-sync` e seus testes foram preservados.

Não foram removidos primitives shadcn; o catálogo continua exigindo decisão conjunta antes de qualquer exclusão.

### Configuração e dependências

- `packageManager` fixa `pnpm@10.34.5`; `.node-version` fixa Node 24.18.1; CI fixa Deno 2.8.2.
- `@supabase/supabase-js` foi alinhado em 2.111.0 e `react-router` atualizado para 8.3.0.
- `@playwright/mcp` deixou de usar `@latest` e foi fixado em 0.0.78.
- A auditoria de produção foi adicionada ao CI.
- Um orçamento versionado limita cada chunk JS a 300 KiB, CSS a 200 KiB e o total de assets a 2 MiB.
- Tipos Vitest/Node deixaram de vazar para `tsconfig.app.json`; `tsconfig.test.json` os declara explicitamente.
- Referências a `src/mocks/table-data/seed.ts`, arquivo inexistente, foram removidas dos tsconfigs.
- Tokens de fonte autorreferentes foram substituídos por stacks reais; a escala de radius agora é multiplicativa e inclui `xs`.
- `.env.example` contém apenas configuração pública; `supabase/functions/.env.example` documenta segredos e ERP sem valores reais.
- `site_url`, RP ID e origin produtivos usam o domínio canônico. Previews não estão na lista de origins de passkey.

O update do React Router remove a dependência afetada pelo [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2).

## Achados por área e estado da refatoração

| Área/feature | Achado confirmado | Estado nesta onda | Próxima ação segura |
|---|---|---|---|
| `access-requests` | rota ampla e superfície de barrels extensa | preservado | separar controller/painel em commit próprio |
| `audit` | serviço sintético | corrigido | adicionar paginação e filtros server-side ao gateway |
| `auth` | fronteira de segurança madura; contratos passkey sensíveis ao domínio | domínio alinhado | executar plano explícito de recadastro e testes de origins |
| `clients` | serviço ignorava gateway real; schemas ainda próximos do I/O | fonte real corrigida | mover schemas wire para `schemas/` sem alterar contrato público |
| `dashboard` | componente grande e mock-only | oculto em produção | só reativar após read model real |
| `my-profile` | form card grande, tipos/copy dispersos | não alterado | dividir por seções e aplicar Field/FieldGroup |
| `notifications` | gateway real; exports sem alcance | não alterado | confirmar dead exports com consumidores dinâmicos |
| `operations` | normalizador dormente; formatter de movimentações ainda usado por previews | implementação morta removida e contrato documentado | revisar o formatter remanescente quando existir read model real |
| `permissions` | fallback local mascarava indisponibilidade | corrigido | casos negativos de JWT/permissão na função |
| `prices` | integração real com camada compat | preservado | migrar consumidores antes de remover compat |
| `reports` | mock-only e duplicado com dashboard | oculto em produção | convergir para read model operacional futuro |
| `rules` | formulário grande e acoplamento de consulta | preservado | separar responsabilidades sem mover regra ao componente |
| `security` | UI anuncia capacidades além do suporte efetivo | preservado | alinhar copy/capability e dividir card |
| `sync` | infraestrutura genérica e cópias por domínio não possuíam consumidores | código dormente removido; disparos reais preservados | criar UI somente quando houver rota, requisito e testes de fluxo aprovados |
| `units` | backend real; normalização/sync misturados | preservado | separar model/schema e adotar runner compartilhado |
| `users` | falsos sucessos e rota ampla | gateway corrigido | dividir tabs/panels/controllers mantendo chamadas reais |
| `yard` | placeholder | oculto em produção | exigir contrato operacional e seleção real de unidade |
| `captures` | diretório vazio não rastreado | sem artefato Git | não recriar sem capability aprovada |

## Matriz de autenticação das Edge Functions

Esta matriz deriva de `supabase/config.toml` e do alcance estático dos chamadores. Ela não substitui os testes negativos nem a inspeção do ambiente efetivo.

| Função | `verify_jwt` | Classe | Requisito da próxima validação |
|---|---:|---|---|
| `auth-password` | false | autenticação pública | CORS, HMAC/CPF, rate limit e resposta genérica |
| `auth-recovery-request` | false | recuperação pública | rate limit, enumeração e auditoria redigida |
| `auth-passkey-login` | false | início WebAuthn público | challenge, origin, RP ID e replay |
| `admin-recovery-review` | true | administração | JWT, permissão e transição idempotente |
| `admin-user-auth-factors` | true | administração | JWT, permissão e ausência de vazamento |
| `admin-user-block` | true | administração | JWT, permissão e auto-bloqueio |
| `admin-user-clear-lock` | true | administração | JWT, permissão e estado concorrente |
| `admin-user-create` | true | administração | JWT, permissão, unicidade e compensação |
| `admin-user-reset-passkey` | true | administração | JWT, permissão e revogação completa |
| `admin-user-reset-password` | true | administração | JWT, permissão e sessão existente |
| `admin-user-revoke-sessions` | true | administração | JWT, permissão e idempotência |
| `admin-user-update` | true | administração | JWT, permissão, escopo e conflito |
| `auth-register-passkey` | true | usuário | sessão, origin, RP ID e challenge |
| `auth-complete-passkey` | true | usuário | sessão, challenge, replay e contador |
| `list-permission-matrix` | true | consulta protegida | JWT e `permissions.read` |
| `profile-change-password` | true | usuário | sessão recente e revogação |
| `profile-update` | true | usuário | propriedade, schema e auditoria |
| `units-sync` | false | service-to-service | HMAC/segredo, timestamp, replay, retry e idempotência |
| `clients-sync` | false | service-to-service | HMAC/segredo, timestamp, replay, retry e idempotência |

A configuração segue a distinção atual entre [autenticação de Edge Functions](https://supabase.com/docs/guides/functions/auth) e [configuração por função](https://supabase.com/docs/guides/functions/function-configuration). Para banco, a validação final deve confirmar as recomendações oficiais de [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), especialmente `SELECT` necessário a `UPDATE`, `USING`/`WITH CHECK` e views `security_invoker`.

## Validações executadas nesta onda

| Gate | Resultado |
|---|---|
| Inventário/validador estrutural | passou; contagem final regenerada junto com os inventários |
| TypeScript aplicação após gateways/config | passou |
| TypeScript testes após adapters explícitos | passou |
| ESLint completo | passou |
| Vitest completo | passou: 61 arquivos e 217 testes, sem `skip`/`only` |
| Tempo do Vitest completo final | 352,97 s; setup agregado 755,94 s entre workers |
| Build produtivo | passou; maior JS 283,86 kB, CSS 181,75 kB |
| Previews no bundle produtivo | passou; sem chunks Dashboard, Reports ou Yard |
| Deno check | passou nas 19 Edge Functions |
| Auditoria de dependências produtivas | passou; nenhuma vulnerabilidade conhecida |
| Banco local | 55 migrations presentes; `db lint` sem warnings após migration aditiva |
| Contratos estruturais do banco | passou: RLS em todas as tabelas public, views invoker, grants/search_path de definers e policies UPDATE/ALL |

O comando `supabase db reset --local` aplicou as 54 migrations preexistentes, confirmado diretamente em `supabase_migrations.schema_migrations`, mas não encerrou por instabilidade do container auxiliar de logs. A migration aditiva 55 foi aplicada por `migration up --local` e o lint final ficou limpo. O schema foi validado; a saúde integral da stack local continua separada desse resultado.

Para tornar a execução reproduzível no CI e evitar explosão de processos em Windows/jsdom, o script `pnpm test` fixa quatro workers. O orçamento atual ainda é alto e deve ser reduzido, mas a suíte deixou de ser inconclusiva.

## Adendo de publicação e autenticação — 2026-08-01

- A onda estrutural foi publicada diretamente em `main` no commit `e9b00f7`, após autorização explícita para revisar e publicar todo o worktree.
- A inspeção autorizada confirmou paridade das migrations locais e remotas. Duas migrations aditivas posteriores elevaram o estado final para 57 migrations: uma RPC protegida de revogação de sessões e uma notificação explícita de recarga do schema PostgREST.
- Sete Edge Functions passavam UUID de usuário para `auth.admin.signOut`, cuja assinatura exige um JWT de sessão. Elas agora usam `public.revoke_auth_user_sessions(uuid)`, disponível somente para `service_role`, que delega a exclusão a uma função `private` com `security definer` e `search_path` fixo.
- A configuração Auth remota foi alinhada ao domínio canônico `estacionamento.redemontecarlo.com.br`. O provedor interno de e-mail/senha foi habilitado porque o login por CPF autentica por e-mail técnico; o cadastro público global permanece desabilitado.
- O usuário proprietário solicitado foi reconciliado de forma idempotente nos ambientes local e remoto. Nome, CPF exibível, telefone, e-mail, papel `owner`, bloqueios e tentativas foram conferidos; o estado final permanece `pending` para exigir troca de senha.
- O fluxo `auth-password` retornou `set_new_password` nos dois ambientes. Os fluxos e sessões criados apenas para verificação foram removidos, sem concluir a troca de senha em nome do usuário.
- Os gates pós-correção passaram: inventário de 762 arquivos/57 migrations, ESLint, dois typechecks, build e orçamento, 19 entradas Deno, lint/contratos SQL e Vitest completo com 61 arquivos/217 testes em 294,51 s.
- Chaves administrativas, HMACs e senha temporária não são persistidos neste relatório nem em arquivos do repositório.

## Pendências que exigem ambiente ou onda própria

1. Complementar `supabase/tests/security-contracts.sql` com atores/claims reais; os contratos estruturais passam, mas ainda não provam autorização ponta a ponta.
2. Corrigir a instabilidade do container `supabase_vector_estacionamento`, que impediu o CLI de encerrar o reset apesar de o schema ter sido aplicado.
3. Perfilar o setup do Vitest: a suíte agora termina, mas o custo agregado de setup permanece alto.
4. Separar grandes routes/forms em ondas por domínio; a limpeza de sync sem consumidor foi concluída sem alterar os gateways críticos.
5. Validar recadastro de passkeys ao migrar credenciais do domínio antigo para o canônico.
6. Decidir o catálogo de primitives shadcn antes de remover dependências ou arquivos sem consumidor aparente.

## Critérios de aceite remanescentes

- testes finais de RLS/grants/views/functions com identidades e claims representativos;
- casos negativos e idempotência para cada Edge Function;
- ausência comprovada de fixtures em serviços e bundle produtivos;
- inventário regenerado depois de cada onda estrutural;
- documentação de features atualizada conforme as rotas/controllers forem divididos.

## Referências analisadas

- `package.json`, `pnpm-lock.yaml`, tsconfigs, ESLint, Vite, CI, Vercel, MCP, shadcn e Supabase config;
- código e testes em `src/`, `tests/`, `scripts/`, `docs/`, `public/`, `.github/` e `supabase/`;
- catálogo/configuração local shadcn em `components.json` e baseline de `components/ui`;
- documentação oficial shadcn e Supabase ligada ao longo deste relatório;
- advisory GitHub do React Router ligado na seção de dependências;
- inventários CSV/JSON gerados a partir de `git ls-files --cached --others --exclude-standard` e do estado local.
