# Preços e Regras Comerciais - Análise Forense e Referência de Implementação

Data: 2026-07-09

## Escopo

Este documento consolida a análise crítica dos arquivos de preços e regras comerciais nos repositórios `projetosmc/estacionamento` e `igornicoletti/estacionamento`, as fontes externas consultadas e as decisões dedutivas usadas para implementar a base de preços e regras na nova aplicação.

A implementação não copia código do projeto de referência. O repositório antigo foi usado como evidência de domínio, nomes de conceitos e riscos operacionais; a nova implementação segue os padrões locais de `igornicoletti/estacionamento`.

## Metodologia

- Repositório atual analisado: `igornicoletti/estacionamento`, workspace local `C:\Users\igor.nicoletti\Downloads\shadcn-data-table-generic`.
- Repositório de referência analisado: `projetosmc/estacionamento`, clone local temporário em `C:\Users\igor.nicoletti\Downloads\_codex_repos\projetosmc-estacionamento`.
- Busca por arquivos de domínio feita por nomes `precos`, `regras`, `vip`, `cobranca` e páginas/tabelas relacionadas.
- Documentação externa consultada somente em fontes oficiais ou referência técnica reconhecida.
- Não foram criados seeds, defaults comerciais ou dados de operação sem evidência.
- O projeto Supabase conectado foi inspecionado em modo leitura; nenhuma alteração remota de banco foi aplicada.

## Evidências do Projeto de Referência

Arquivos de preços analisados em `projetosmc/estacionamento`:

- `src/features/precos/precosContracts.ts`: define contrato de tabela de preço, escopo padrão/unidade, carência, tolerância, ciclo, valor, vigência, status, versão, filtros e paginação.
- `src/features/precos/precosData.ts`: usa tabelas/RPCs de leitura e mutação, incluindo listagem, facets, criação transacional e auditoria de origem.
- `src/features/precos/precosDisplay.ts`: centraliza formatação e rótulos de preço.
- `src/features/precos/components/PrecosTable.tsx`: organiza a tabela como principal superfície operacional.
- `src/pages/PrecosPage.tsx`: página de consulta/ação para preços.
- `src/lib/schemas/precos.ts`: validação de payloads de preço.
- `src/lib/precoFaixasEvaluator.ts`: avaliação de faixas e ciclos de cobrança.
- `src/shared/i18n/pt-BR/precos.ts`: termos de negócio usados na UI.
- `src/test/precos-regras-checklist.test.ts` e `src/features/precos/precosCreateContract.test.ts`: checklist de regressão e contrato de criação.

Dedução: preço não é apenas um valor monetário. O domínio exige escopo, vigência, carência, tolerância, ciclo, faixas, versionamento e justificativa. Portanto, uma página nova não deve exibir dados mockados nem aceitar configuração incompleta de unidade.

Arquivos de regras analisados em `projetosmc/estacionamento`:

- `src/features/regras/regrasContracts.ts`: define tipos `VIP` e `BENEFICIO_ABASTECIMENTO`, escopos, prioridade, vigência, filtros e status.
- `src/features/regras/regrasData.ts`: usa tabela/RPCs para regras comerciais, alteração de VIP, auditoria e invalidação de cache.
- `src/features/regras/regrasDisplay.ts`: centraliza rótulos e exibição.
- `src/features/regras/components/RegrasTable.tsx`: lista regras por tipo, escopo, vigência e prioridade.
- `src/pages/RegrasComerciaisPage.tsx`: página operacional de regras comerciais.
- `src/lib/schemas/regras.ts`: validação de entrada.
- `src/shared/i18n/pt-BR/regras.ts`: termos de negócio.
- `src/lib/cobrancaEngine.ts` e `src/lib/cobrancaEngine.test.ts`: evidenciam precedência operacional `VIP > Bloqueado > Carência > Benefício abastecimento > Tolerância > Cobrança`.

Dedução: VIP não pode ser tratado como simples booleano de cliente sem escopo, porque há diferença entre VIP de cliente e VIP de veículo. Benefício de abastecimento existe como regra comercial separada e precisa de requisitos próprios antes de expor criação/edição na nova UI.

## Evidências do Projeto Atual

Arquivos analisados em `igornicoletti/estacionamento`:

- `src/features/prices/routes/prices-route.tsx`: era placeholder sem gateway, tabela, testes ou persistência.
- `src/features/rules/services/vip-rules-service.ts`: persistia VIP em `localStorage` e gerava ids aleatórios por toggle, o que permitia duplicidade.
- `src/features/rules/routes/rules-route.tsx`: já possuía página de regras VIP, mas com escopo limitado.
- `src/features/rules/columns/vip-rules-columns.tsx`: já usava o `DataTable` central.
- `src/features/clients/routes/clients-route.tsx` e `src/features/clients/routes/client-vehicles-route.tsx`: já consumiam o serviço de VIP para cliente/veículo.
- `src/components/data-table/*`, `src/components/page/*`, `src/components/ui/*`: padrão local de tabela, cabeçalho, seção, badges e sheet de detalhes.
- `src/features/auth/authorization/authorization-policy.ts`: rotas comerciais protegidas por `commercial.prices.read` e `commercial.rules.read`.

Dedução: a implementação deveria reutilizar `DataTable`, `PageHeader`, `PageSection`, `Badge`, `DataTableDetails`, hooks com `useAsyncSnapshot` e gateways injetáveis para manter consistência com unidades, clientes e usuários.

## Fontes Externas Consultadas

- Supabase Row Level Security: `https://supabase.com/docs/guides/database/postgres/row-level-security`
  - Dedução: tabelas expostas via API devem ter RLS ativo; políticas precisam filtrar por usuário autenticado e papel ativo.
- Supabase Securing your API: `https://supabase.com/docs/guides/api/securing-your-api`
  - Dedução: além de RLS, tabelas e funções expostas precisam de grants explícitos e escopo mínimo.
- Supabase changelog de 2026-04-28: `https://supabase.com/changelog`
  - Dedução: novas tabelas no schema `public` não devem depender de grants implícitos; a migração precisa conceder permissões de forma explícita.
- Supabase JavaScript select/upsert/rpc: `https://supabase.com/docs/reference/javascript/select`, `https://supabase.com/docs/reference/javascript/upsert`, `https://supabase.com/docs/reference/javascript/rpc`
  - Dedução: leituras devem selecionar somente colunas necessárias; `upsert` precisa de `.select()` quando a UI depende da linha salva.
- Vite env: `https://vite.dev/guide/env-and-mode`
  - Dedução: somente variáveis `VITE_*` chegam ao cliente; nenhuma chave administrativa ou `service_role` pode aparecer no frontend.
- TanStack Table v8: `https://tanstack.com/table/v8/docs/guide/column-defs`, `https://tanstack.com/table/v8/docs/guide/sorting`, `https://tanstack.com/table/v8/docs/guide/column-filtering`
  - Dedução: colunas, ordenação e filtros devem ser configurados no contrato da tabela, não por marcação manual.
- React `useMemo`: `https://react.dev/reference/react/useMemo`
  - Dedução: colunas e opções derivadas da tabela devem ser memoizadas para evitar trabalho repetido em renderizações.
- OWASP Authorization Cheat Sheet: `https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html`
  - Dedução: autorização deve seguir menor privilégio, negar por padrão e ser validada em cada acesso.
- MDN `localStorage`: `https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage`
  - Dedução: `localStorage` é persistência local por origem, pode falhar e não é fonte confiável para regra comercial de produção.

## Decisões Dedutivas Aplicadas

1. Preços precisam de modelo próprio.
   - Criada a entidade `PriceTable` com escopo, unidade, carência, tolerância, ciclo, valor, vigência, status, versão, motivo, observação e faixas.
   - `computedStatus` é derivado de `status`, `startsAt` e `endsAt`, não gravado como dado de negócio independente.

2. A página de preços não deve inventar dados.
   - Sem seed operacional e sem copiar valores do projeto antigo.
   - Quando não houver registro real, a página mostra estado vazio.

3. VIP precisa de identidade determinística.
   - Cliente: `vip-client:{clientId}`.
   - Veículo: `vip-vehicle:{clientId}:{vehicleId}`.
   - Toggling atualiza a mesma regra natural, evitando duplicidade.

4. VIP de veículo não deve promover o cliente inteiro.
   - `isClientVipFromRules` só considera regra ativa de cliente.
   - `isVehicleVipFromRules` considera regra ativa de veículo ou regra ativa de cliente cobrindo todos os veículos.

5. Supabase deve ser a fonte de produção.
   - Criada migration para `commercial_price_tables`, `commercial_price_tiers` e `commercial_rules`.
   - RLS habilitado, grants explícitos para `authenticated` e políticas por papel ativo em `app_users`.
   - `owner`, `admin` e `auditor` podem ler; somente `owner` e `admin` podem mutar.

6. Fallback local não é autoridade.
   - `localStorage` permanece como fallback quando Supabase não está configurado no browser, com tratamento de erro.
   - Testes usam gateway in-memory injetável, não dados globais compartilhados.

7. Benefício de abastecimento foi modelado no banco, mas não exposto como CRUD.
   - A evidência mostra que a regra existe, mas os parâmetros operacionais de produção precisam ser confirmados antes de criar tela de cadastro.
   - A migração aceita `fuel_benefit` com litros mínimos, horas de benefício, prioridade, escopo, vigência e status.

## Implementação Entregue

- `src/features/prices/types/prices-types.ts`: contrato de preços.
- `src/features/prices/utils/prices-models.ts`: sanitização, status derivado, ordenação e formatação.
- `src/features/prices/services/prices-service.ts`: gateway Supabase/local/in-memory para listagem de tabelas de preço.
- `src/features/prices/hooks/use-prices.ts`: hook baseado em `useAsyncSnapshot`.
- `src/features/prices/columns/prices-columns.tsx`: colunas com badges, detalhes e formatação.
- `src/features/prices/routes/prices-route.tsx`: página real de preços usando `DataTable`.
- `src/features/rules/services/vip-rules-service.ts`: gateway Supabase/local/in-memory, ids determinísticos, deduplicação e escopo correto de VIP.
- `src/features/rules/columns/vip-rules-columns.tsx`: coluna de abrangência e ação de ativar/inativar.
- `src/features/rules/routes/rules-route.tsx`: página ajustada para regras comerciais.
- `supabase/migrations/20260709084549_commercial_prices_rules.sql`: schema comercial, checks, índices, triggers, RLS, grants e policies.
- `tests/features/prices/*` e `tests/features/rules/vip-rules-service.test.ts`: cobertura de normalização, status, página e regras VIP.
- `tests/setup.ts`: isolamento de gateway in-memory para regras nos testes.

## Checklist de Produção

- Aplicar a migration em ambiente Supabase com revisão de DBA antes de habilitar dados reais.
- Confirmar que `public.set_updated_at_timestamp()` existe no banco antes da migration comercial.
- Validar papéis em `app_users` para `owner`, `admin` e `auditor`.
- Não expor `service_role` nem segredo administrativo em `src/`.
- Popular `commercial_price_tables` somente com dados comerciais homologados.
- Registrar motivo em alterações de preço/regra quando houver fluxo de escrita.
- Confirmar requisitos de benefício de abastecimento antes de expor CRUD.
- Executar `pnpm validate`, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` antes de entrega.

## Validação Desta Revisão

- `pnpm validate`: aprovado.
- `pnpm lint`: aprovado.
- `pnpm typecheck`: aprovado.
- `pnpm vitest run tests/features/prices/prices-service.test.ts tests/features/prices/prices-route.test.tsx tests/features/rules/vip-rules-service.test.ts`: 3 arquivos, 7 testes aprovados.
- `pnpm test`: 39 arquivos, 106 testes aprovados.
- `pnpm build`: aprovado.

Observação: o build informa avisos não bloqueantes de import dinâmico inefetivo para rotas de auth que também são importadas estaticamente pelo barrel de auth. Isso não foi introduzido pela implementação comercial.

## Riscos e Dependências

- O projeto Supabase conectado não possuía tabelas comerciais reais no momento da inspeção de catálogo.
- A migration foi criada localmente, mas não aplicada no banco remoto nesta revisão.
- A página de preços é consulta segura e preparada para produção; criação/edição de preço não foi exposta sem requisitos formais de aprovação, auditoria e dados homologados.
- Regras comerciais além de VIP foram modeladas em banco para evolução, mas a UI atual preserva somente o fluxo existente de VIP.
- Valores operacionais observados no projeto antigo foram tratados como evidência histórica, não como default da nova aplicação.
