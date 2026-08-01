# Revisão forense — `src/features/rules`

Data da revisão: 2026-08-01
Escopo: 26 arquivos, 3 testes, integração com Clients/Units, capabilities, tabela/RLS e RPC versionada.
Estado: auditoria concluída; implementação pendente da etapa consolidada.

## Parecer executivo

A feature oferece tabela, filtros, detalhes, criação/edição, ativação, regras VIP, abastecimento e limpeza de pátio. A UI reutiliza os componentes compartilhados e o backend possui RPC versionada com autorização, encerramento da versão anterior, ator server-side e audit event.

Entretanto, a implementação ativa está incompatível com o contrato SQL: frontend usa `fuel` onde o enum exige `fuel_benefit`, `global` onde exige `network`, e seleciona `active` embora a tabela use `status`. O arquivo de schema “compat” conhece parte dos valores corretos, mas não é o schema usado pelo formulário. O service ignora `id` deliberadamente por versionamento, sem deixar isso claro na UI. Como os testes mockam `vip-rules-service`, não detectam essas quebras produtivas.

O formulário também carrega `listClients()` integralmente para um Combobox. No gateway atual isso pode trazer até 60 mil clientes e PII ao browser. Regras de unidade são digitadas como IDs separados por vírgula e o RPC não valida existência/escopo autorizado dos clientes, veículos e unidades. Essas fronteiras precisam ser corrigidas antes de liberar escrita.

## Fluxo atual

```text
RulesRoute (rules.read)
  -> useVipRules -> vip-rules-service (compat) -> rules-service
  -> SELECT commercial_rules com colunas/tipos divergentes
  -> normalizador permissivo -> DataTable

Dialog
  -> listClients (catálogo integral)
  -> validação form em enums de UI
  -> save_commercial_rule_version
  -> encerra versão anterior + cria versão + audit event
```

## Achados priorizados

### P0 — contrato frontend/banco quebrado

1. `RULES_SELECT` pede `active`; schema SQL armazena `status`.
2. UI/domínio envia `type = fuel`; enum/RPC exige `fuel_benefit`.
3. UI/domínio envia `targetType = global`; enum/RPC exige `network`.
4. Schema compat e seus testes usam `ruleType`, `fuel_benefit` e `network`, enquanto formulário ativo usa `type`, `fuel` e `global`. Há duas fontes conflitantes.
5. Normalizador transforma tipos desconhecidos em VIP/global e `active` ausente em false, ocultando incompatibilidade como dado válido/inativo.

Criar schemas wire/form únicos e adapters explícitos. Preferência: domínio pode usar nomes de produto, mas gateway deve mapear exatamente e rejeitar qualquer valor inesperado.

### Alta

6. **PII e escala no Combobox:** `listClients()` integral carrega CPF/CNPJ, telefone, e-mail e outros campos desnecessários, embora só sejam usados id/nome. Criar endpoint de lookup autorizado, paginado e minimizado.
7. **Autorização visual:** rota exige `rules.read`, mas adicionar/editar/status aparecem para todos. Exigir `rules.manage` na UI, mantendo RLS/RPC como enforcement. A capability também está ausente do catálogo ativo local auditado.
8. **Referências não validadas:** cliente/veículo/unidade podem ser digitados e o RPC não confirma existência nem acesso do ator. Resolver por endpoints autorizados e validação server-side.
9. **Semântica de edição/status:** toda ação cria nova versão; `id` do payload não é enviado. Isso pode ser correto, mas deve preservar parent/version por identidade lógica e ser descrito como versionamento. Verificar corrida entre dois saves concorrentes com lock/constraint.

### Média

10. Formulário de ~15,8 kB mistura catálogo, controller, mapeamento e campos; dividi-lo por seções e hooks nomeados.
11. Para alvo veículo, não há seleção de cliente/veículo relacionada; `clientId` pode permanecer vazio e a validação exige apenas `vehicleId`, embora RPC VIP use ambos para localizar versão.
12. Regra VIP exige `benefitHours` na UI, mas RPC/schema histórico de VIP não exige/usa benefício da mesma forma; validar requisito de negócio.
13. `appliesToAllUnits` pode ser true com target `unit`; RPC decide por target/ids. Invariantes de target, units e yard cleaning precisam ser discriminated union real.
14. Limite 500 e `isTruncated` são retornados pelo hook, mas ignorados pela rota. Adotar partialidade/paginação/filtros server-side.
15. Normalização manual aceita floats/negativos em arrays, duplica IDs e converte corrupção em defaults.
16. Duplicação: `rules-service`, `vip-rules-service` e `useVipRules` repetem toggles/adapters; remover camada compat após migrar consumidores em Clients.
17. Deep import/export público amplo e seis barrels; `users` de referência usa fronteiras mais estreitas.
18. Status update reutiliza payload completo derivado de dado possivelmente truncado/stale; oferecer comando server-side específico/idempotente por identidade/version.
19. Erros públicos são genéricos (bom para sanitização), mas não há mapping de conflito/autorização/indisponibilidade nem correlation id.

### Baixa

20. Strings de Sheet, confirmação, empty do Combobox e helpers (`Todas as unidades`, `Todos os veículos`) estão hardcoded apesar da copy.
21. `RequiredMark` não está marcado decorativo; Checkbox/label podem ser semanticamente aprimorados.
22. `default export` da rota e nested barrels são desnecessários.
23. README/VALIDATION afirmam proteção contra payload inesperado, quando normalização permissiva o mascara.

## Segurança e rastreabilidade

- Query builder/RPC parametrizada: sem SQL dinâmico no browser, portanto nenhuma injeção SQL direta encontrada.
- React escapa strings; sem `dangerouslySetInnerHTML`; XSS direto não confirmado.
- RLS/RPC exigem capabilities, mas catálogo `rules.manage` precisa ser reparado e testado por papel.
- RPC cria audit event na mesma função sem bloco que engula erro na versão examinada, favorecendo atomicidade; confirmar definição final após reset.
- `created_by/updated_by` são server-side no RPC. Nenhuma escrita direta deve contornar essa trilha.
- Evitar logs/payloads com CPF, placa, cliente ou IDs internos. Combobox deve receber DTO mínimo.
- Escopo de unidade deve ser derivado/autorizado no servidor; não confiar na lista enviada pelo browser.

## Performance

- Regras: consulta limitada e sem N+1, mas filtros locais/truncamento oculto.
- Clientes: gargalo crítico; lookup integral e render local podem usar dezenas de MB e expor PII. Busca server-side debounced, cancelável e limitada.
- RPC de versionamento deve usar índice/constraint/locking correspondente à identidade lógica para impedir versões concorrentes ativas.
- Generation guard do `useAsyncSnapshot` deve ser validado; lookup de cliente também precisa cancelamento/respostas fora de ordem.

## Acessibilidade/UX

- Base usa `Field`, Select, Combobox, Sheet, AlertDialog e estados vazios.
- Corrigir required semantics, foco no primeiro erro, erro de lookup, loading/empty do Combobox, seleção apenas por teclado e anúncio de resultado.
- Não exibir campos técnicos editáveis quando uma entidade pode ser escolhida por nome.
- Testar fluxo target/type condicional, retorno de foco, Escape, 320–1024 px, zoom e leitor de tela.
- Ocultar ações de manage sem capability; não usar falha 403 como UX normal.

## Testes atuais e lacunas

Os 17 casos atuais exercitam schemas compat, render/mutações mockadas e regras VIP puras. Faltam:

- SELECT e RPC no banco local real com mappings de tipo/target/status;
- regras discriminadas e invariantes por tipo/alvo;
- RLS/capability por papel e sessão revogada;
- versionamento concorrente, parent/version, rollback e audit event;
- lookup mínimo/paginado de clientes/veículos/unidades e ausência de PII;
- truncamento/filtros/cursor, resposta fora de ordem e cancelamento;
- acessibilidade/teclado/foco/viewports/estados de lookup;
- validação de strings, placas, IDs, limites e duplicidades.

## Matriz arquivo a arquivo

| Arquivo | Papel | Achado / ação recomendada |
| --- | --- | --- |
| `components/index.ts` | Barrel do dialog | Remover. |
| `components/vip-rule-form-dialog.tsx` | Form e catálogos | Grande, carrega clientes integrais/PII, campos técnicos livres. Dividir e usar lookups autorizados mínimos. |
| `constants/index.ts` | Barrel | Remover. |
| `constants/rules-copy.ts` | Copy | Boa base; incorporar todos hardcodes e estados de lookup/parcialidade. |
| `constants/rules-persistence.ts` | Chaves/limite | Chaves usadas; partialidade do limite não é. Integrar ao contrato server-side. |
| `docs/README.md` | Arquitetura | Desatualizado/otimista; reescrever com versionamento e segurança reais. |
| `docs/VALIDATION.md` | Checklist | Sem evidências; consolidar em README/testes. |
| `hooks/index.ts` | Barrel público interno | Formatação/toggles misturados; remover. |
| `hooks/use-rules.ts` | Snapshot, VIP helpers e toggles | Muitas responsabilidades/compat array. Separar controller React de regras puras e casos de uso. |
| `index.ts` | API pública | Muito amplo e aliases compat. Estreitar ao contrato necessário por Clients; evitar ciclos. |
| `model/index.ts` | Barrel model | Remover após separar tipos. |
| `model/rules-details.ts` | Presenter Sheet | Coeso, mas depende de UI em model. Mover para presenter/components. |
| `model/rules-form-schema-compat.ts` | Schemas históricos | Mais próximo do wire, mas contradiz form e usa `.passthrough()`. Substituir por schemas canônicos strict. |
| `model/rules-formatting.ts` | Labels/formatters | Coeso; retirar hardcodes, validar dates e manter domínio puro. |
| `model/rules-normalization.ts` | Adapter manual | Defaults perigosos; substituir por schema wire + mapper explícito. |
| `model/rules-types.ts` | Domínio/wire/form | Mistura representações e enums divergentes. Separar. |
| `model/rules-validation.ts` | Schema form ativo | Não é discriminated union real; invariantes incompletas. Mover para `schemas/` e alinhar ao banco. |
| `routes/index.ts` | Barrel rota | Remover. |
| `routes/rules-route.tsx` | Página/controller | Falta capability manage, ignora partialidade e duplica payload. Extrair table/controller e comando de status. |
| `schemas/rules-form-schema.ts` | Reexport compat | Fachada para contrato não usado pela UI. Tornar implementação canônica. |
| `services/index.ts` | Barrel service | Remover. |
| `services/rules-service.ts` | Supabase I/O | SELECT/RPC incompatíveis; separar gateway/schema/use cases e mapping. |
| `services/vip-rules-service.ts` | Compat façade/toggles | Duplicação transitória; migrar consumidores e excluir. |
| `table/index.ts` | Barrel table | Remover. |
| `table/rules-columns.tsx` | Colunas/ações | Boa modularidade, mas callbacks opcionais e helpers compensam dados inválidos. Exigir handlers permitidos. |
| `table/rules-filter-options.ts` | Filtros locais | Adequado só a lote completo; migrar para metadados/filtros server-side. |

## Arquitetura-alvo e aceite

Criar `gateways/`, `schemas/`, domínio discriminado em `model/`, casos de uso em `services/`, controller em `hooks/`, tabela/form em `components/table` e apenas um contrato público estreito. Sem nested barrels.

Aceite:

1. wire `fuel_benefit/network/status` é validado e mapeado sem defaults silenciosos;
2. listagem e save funcionam no banco local real;
3. nenhum catálogo integral/PII é carregado para lookup;
4. cliente, veículo e unidade existem e estão no escopo autorizado;
5. `rules.manage` controla UI, RPC e RLS na mesma matriz;
6. versionamento concorrente é atômico, rastreável e sem duas versões ativas;
7. truncamento e erros são explícitos;
8. testes de banco, contrato, segurança, performance e acessibilidade passam.
