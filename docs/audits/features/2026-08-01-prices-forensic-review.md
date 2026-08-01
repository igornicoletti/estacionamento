# Revisão forense — `src/features/prices`

Data da revisão: 2026-08-01
Escopo: 25 arquivos da feature, 3 arquivos de testes, router, capabilities e migrations/RPCs comerciais.
Estado: auditoria concluída; implementação pendente da etapa consolidada.

## Parecer executivo

A interface é visualmente completa e já reutiliza DataTable, `Field`, estados vazios, persistência e diálogos compartilhados. O serviço falha quando Supabase não existe e as escritas dependem de RLS/RPC. Porém o contrato frontend é incompatível com o schema SQL efetivo documentado pelas migrations: a UI opera `scope = global`, status `draft/archived` e `name`, enquanto o banco define `network|unit`, `active|inactive` e não possui coluna/parâmetro `name`. A criação envia `global` diretamente para um enum `commercial_price_scope`; a leitura seleciona uma coluna inexistente; o modo “editar” ignora o `id` e sempre cria outra tabela. Portanto, a feature não satisfaz integridade produtiva apesar de seus testes verdes.

Há ainda uma divergência transversal já confirmada em Permissions: `prices.manage` continua no frontend e nas policies/RPC, mas não está no catálogo ativo local. A rota exige apenas `prices.read` e mostra ações de escrita a qualquer leitor. A UI pode apresentar controles que inevitavelmente falham, enquanto owners passam pelo wildcard. O fluxo deve ser corrigido em conjunto com o catálogo e testado contra banco real.

## Fluxo atual e inconsistências

```text
PricesRoute (prices.read)
  -> usePriceTables -> listPriceTables
  -> SELECT commercial_price_tables com `name` e limit 501
  -> normalização permissiva para domínio global/draft/archive
  -> DataTable e filtros locais

Form -> validatePriceTableForm -> savePriceTable
  -> RPC create_commercial_price_table (sempre create; id/name ignorados)

Status -> UPDATE commercial_price_tables.status
  -> RLS prices.manage; sem RPC de auditoria/updated_by
```

## Achados priorizados

### P0 — contrato frontend/banco incompatível

1. `commercial_price_tables` não possui `name`, mas a leitura seleciona `name` e a UI exige/exibe o campo.
2. O enum SQL aceita `network|unit`; o payload do formulário usa `global|unit` e envia `global` sem adapter.
3. O enum SQL aceita apenas `active|inactive`; o domínio/schema compat aceita também `draft|archived`.
4. O schema de teste valida `network`, enquanto a validação realmente usada pelo formulário valida `global`; são dois contratos conflitantes.
5. “Editar” inclui `id` no formulário, mas `savePriceTable` ignora `id`; não há update/versionamento observável. A ação pode criar nova linha e ainda informar sucesso.

Decisão necessária: alinhar o produto ao contrato SQL (`network`, sem nome/status extras) ou criar migration aditiva e RPC versionada que formalize nome e lifecycle. Não mascarar por normalização silenciosa.

### Alta

6. **Autorização visual divergente:** a rota exige somente `prices.read`, mas sempre exibe adicionar, editar e ativar/inativar. Mostrar ações apenas com `prices.manage`; backend continua sendo enforcement.
7. **Capability inoperante para papéis esperados:** `prices.manage` está ausente do catálogo ativo auditado. Restaurar matriz aprovada antes de liberar escrita.
8. **Rastreabilidade incompleta:** update direto de status não atualiza `updated_by` server-side e não registra audit event. A criação captura o ator, mas engole falha de auditoria com warning, permitindo alteração sem trilha completa.
9. **Unidade livre e desnormalizada:** usuário digita `unitId`/`unitName`; não há seleção autorizada nem FK confirmada. Pode persistir unidade inexistente, nome divergente ou revelar identificador técnico. Consultar unidades permitidas e validar server-side.

### Média

10. Normalização transforma dados inválidos em `0`, epoch, `global`, `inactive` ou registro sem nome, em vez de falhar. Isso pode exibir preço zero ou vigência 1970 como dado real.
11. Hook contém compatibilidade de retorno array e campos legados; o serviço atual retorna objeto. Remover depois de confirmar todos os consumidores.
12. Limite 500 sinaliza `isTruncated`, mas a rota ignora o sinal; usuário acredita ver o conjunto completo. Implementar estado parcial e paginação/filtros server-side.
13. Sem gateway/schema de wire; service faz I/O, casting e composição. Separar `gateways/`, `schemas/`, domínio e formulário.
14. Formulário de ~11 kB mistura adaptação de registro, estado, validação e todos os campos. Dividir por seções/controlador sem wrappers artificiais.
15. Datas `datetime-local` usam `toISOString`/UTC e podem deslocar horário local ao editar. Definir timezone de negócio e conversores testados.
16. `parseNumber` remove todos os pontos: `30.5` vira `305`; aceitar formato local com parser inequívoco ou input monetário controlado.
17. `handleUpdatePriceTableStatus` não captura o `refetch` posterior; sucesso da mutação seguido de erro de leitura pode rejeitar o handler e manter diálogo/estado inconsistente.
18. Barrels internos e raiz pública expõem quase toda a implementação e aliases legados usados apenas por testes.

### Baixa

19. `default export` da rota é desnecessário; router usa named export.
20. Copy do Sheet e label “Continuar” permanecem hardcoded.
21. Botões com Lucide não aplicam `data-icon` consistentemente.
22. `docs/VALIDATION.md` é uma checklist declarativa sem evidências/restrições reais.

## Segurança

- **SQL injection:** não há concatenação SQL no browser; query builder e RPC parametrizada reduzem o risco.
- **XSS:** React faz encoding e não há HTML arbitrário; ainda é preciso impor limites a nome/notas e evitar propagar mensagens do banco.
- **CSRF:** bearer/session + RLS são a fronteira; XSS permanece capaz de agir pela sessão. Não há ação baseada apenas em cookie/GET.
- **Autorização:** `prices.read` protege rota/leitura e `prices.manage` está nas policies/RPC, mas a matriz ativa e a UI divergem. Testar papéis reais.
- **Integridade:** escrita direta de status deve ser substituída por RPC autorizada/idempotente que define `updated_at`, `updated_by` e audit event.
- **PII/internals:** `unitId` técnico não precisa ficar editável nem visível por padrão. Logs e mensagens devem preservar causa somente em telemetria redigida.
- **Privilégios:** revisar grants da função privada e wrapper; funções `SECURITY DEFINER` devem ter `search_path` restrito e não ser executáveis além do necessário.

## Performance e escalabilidade

- Leitura é uma consulta única, ordenada e limitada a 501; não há N+1.
- Filtros/paginação são locais e o truncamento é oculto. Para volume superior a 500, mover busca, status, scope, unidade e cursor ao servidor.
- Criar índices somente a partir das consultas finais e `EXPLAIN`, preservando overlap constraints e índices de vigência úteis.
- Cache `useAsyncSnapshot` precisa invalidar após escrita e impedir resposta velha; validar generation guard já fornecido pelo hook compartilhado.
- `Intl.NumberFormat/DateTimeFormat` pode ser memoizado se profiling mostrar custo relevante; não é gargalo prioritário.

## Acessibilidade e UX

- Pontos fortes: `Field`/`FieldGroup`, labels, `aria-invalid`, estados vazios, confirmação destrutiva e Sheet compartilhado.
- Pendências: capability deve esconder/desabilitar ações com explicação; required mark deve ser decorativo e requisito comunicado semanticamente; focar primeiro erro; associar `FieldError`; testar Select por teclado, Escape, retorno de foco e 320–1024 px.
- Truncamento/parcialidade deve ser anunciado. Erros de conflito de vigência precisam de copy acionável sem detalhes SQL.
- Unidade deve ser combobox autorizado, não dois inputs técnicos.

## Testes

Os 15 casos atuais cobrem schema compat isolado, normalização, render, validação básica e confirmação com serviços mockados. Eles não detectam a incompatibilidade real porque nenhum teste chama o banco/RPC.

Adicionar:

- schema wire estrito e adapter `network <-> domínio`;
- integração local real de SELECT/create/update/versionamento;
- `prices.read` versus `prices.manage` para owner/admin/auditor/manager/operator;
- constraint de sobreposição, vigência, status e unidade inexistente;
- audit event e `updated_by` server-side, incluindo rollback/falha;
- truncamento/cursor/filtros; resposta fora de ordem e cancelamento;
- horário local/DST e dinheiro `30,5`, `30.5`, milhares e valores limites;
- teclado, foco, viewports, erro/vazio/parcial;
- ausência de ações de escrita sem capability e ausência de IDs internos por padrão.

## Matriz arquivo a arquivo

| Arquivo | Papel | Achado / ação recomendada |
| --- | --- | --- |
| `components/index.ts` | Barrel do formulário | Remover nested barrel; rota importa diretamente. |
| `components/price-table-form-dialog.tsx` | Form create/edit | Grande; edit é falso, unidade livre, timezone/parser frágeis. Dividir controller/seções após contrato real e capability. |
| `constants/index.ts` | Barrel de copy/persistência | Remover; imports diretos. |
| `constants/prices-copy.ts` | Copy | Boa base; absorver Sheet/confirm e mensagens de conflito/parcialidade. |
| `constants/prices-persistence.ts` | Chaves e limite | Chaves usadas; limite usado, porém parcialidade ignorada. Manter política junto do contrato de consulta. |
| `docs/README.md` | Arquitetura declarada | Afirma isolamento/RPC sem registrar incompatibilidades e update direto. Reescrever após refatoração. |
| `docs/VALIDATION.md` | Checklist | Superficial; consolidar no README com comandos/casos reais. |
| `hooks/index.ts` | Barrel interno | Remover. |
| `hooks/use-prices.ts` | Snapshot e compat legado | Compat array/fields não tem consumidor atual; remover após migração e propagar parcialidade/cursor. |
| `index.ts` | API pública | Exporta UI, internals e aliases legados. Estreitar; router importa rota direta. |
| `model/index.ts` | Barrel do model | Mistura contratos; remover após separar responsabilidades. |
| `model/prices-details.ts` | Presenter de Sheet | Coeso, mas depende de UI dentro de model; mover para presenter/components e centralizar fallback em copy. |
| `model/prices-form-schema-compat.ts` | Schema histórico | Contradiz o formulário/banco e só é usado por testes. Substituir pelo schema canônico e excluir compat. |
| `model/prices-formatting.ts` | Formatação local | Coeso; testar timezone/moeda e compartilhar apenas se houver semântica idêntica. |
| `model/prices-normalization.ts` | Adapter manual | Converte corrupção em defaults. Substituir por Zod wire estrito + mapper explícito. |
| `model/prices-types.ts` | Domínio, wire e form | Mistura quatro representações e enums incompatíveis. Separar wire/domínio/form/table. |
| `model/prices-validation.ts` | Parsing/validação form | Usado de fato, mas sem máximos do banco, parser monetário ambíguo e timezone implícito. Tornar schema canônico em `schemas/`. |
| `routes/index.ts` | Barrel de rota | Remover. |
| `routes/prices-route.tsx` | Composição e ações | Falta gate `prices.manage`, ignora truncamento e contém hardcodes/estado excessivo. Extrair tabela/controller; remover default export. |
| `schemas/prices-form-schema.ts` | Reexport compat | Arquivo fachada para schema errado. Substituir por implementação canônica, sem reexport reverso. |
| `services/index.ts` | Barrel do service | Remover. |
| `services/prices-service.ts` | SELECT/RPC/update | Contrato incompatível; mistura gateway/caso de uso; update sem auditoria. Criar gateways e RPCs coerentes. |
| `table/index.ts` | Barrel de tabela | Remover. |
| `table/prices-columns.tsx` | Colunas/ações | Reutilizável; ações opcionais podem não ter efeito. Receber capability/handlers obrigatórios e retirar IDs técnicos. |
| `table/prices-filter-options.ts` | Filtros locais | Correto para lote completo; substituir por opções server-side ou metadados agregados quando paginado. |

## Arquitetura-alvo

```text
src/features/prices/
├── components/
│   ├── price-table-form-dialog.tsx
│   ├── price-table-form-fields.tsx
│   └── prices-table.tsx
├── constants/prices-copy.ts
├── gateways/
│   ├── prices-gateway.ts
│   └── supabase-prices-gateway.ts
├── hooks/use-prices-controller.ts
├── model/
│   ├── price-table.ts
│   ├── price-table-mappers.ts
│   └── price-table-rules.ts
├── routes/prices-route.tsx
├── schemas/
│   ├── price-table-form-schema.ts
│   └── price-table-wire-schema.ts
├── services/prices-service.ts
├── table/prices-columns.tsx
└── README.md
```

## Critérios de aceite

1. SELECT e RPC executam contra banco local real sem coluna/enum inexistente.
2. Criar e editar/versionar são semanticamente distintos e atômicos; nenhum falso sucesso.
3. Somente usuários com `prices.manage` veem e executam escrita; RLS/RPC confirma a mesma matriz.
4. `updated_at`, `updated_by` e audit event são server-side em toda mutação.
5. Unidade é selecionada entre registros autorizados e validada no servidor.
6. Nenhum wire inválido vira preço zero/epoch/default silencioso.
7. Truncamento nunca é oculto; paginação/filtro server-side funcionam quando necessário.
8. Testes de contrato, banco, concorrência, segurança e acessibilidade passam junto dos gates globais.
