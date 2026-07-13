# Preços e Regras Comerciais - Análise Forense e Referência de Implementação

Data: 2026-07-09

Atualização de 2026-07-13: a implementação comercial foi endurecida pela auditoria forense. Escritas de preço e regra VIP agora passam por RPCs Supabase transacionais, permissões `prices.manage`/`rules.manage`, RLS por permissão, auditoria e bloqueio de sobreposição de preços ativos.

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
- `src/features/auth/contracts/auth-contracts.ts` e `src/app/router/route-registry.ts`: rotas comerciais protegidas por `prices.read`/`rules.read`; ações de escrita protegidas por `prices.manage`/`rules.manage`.

Dedução: a implementação deveria reutilizar `DataTable`, `PageHeader`, `PageSection`, `Badge`, `AppDetailsSheet`, hooks com `useAsyncSnapshot` e serviços de domínio para manter consistência com unidades, clientes e usuários.

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
   - Criadas migrations para `commercial_price_tables`, `commercial_price_tiers`, `commercial_rules`, permissões comerciais e RPCs de escrita.
   - RLS habilitado, grants explícitos para `authenticated` e políticas por permissão efetiva do usuário.
   - Leitura e mutação são controladas por `prices.read`, `prices.manage`, `rules.read` e `rules.manage`.

6. Fallback local não é autoridade.
   - Serviços comerciais falham quando o Supabase client não está configurado, evitando gravação operacional em `localStorage`.
   - Testes mockam a camada Supabase/RPC em vez de depender de dados globais compartilhados.

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
- `src/features/prices/services/prices-service.ts`: criação via RPC `create_commercial_price_table`.
- `src/features/rules/services/vip-rules-service.ts`: serviço Supabase com ids determinísticos, deduplicação e escopo correto de VIP.
- `src/features/rules/services/vip-rules-service.ts`: salvamento via RPC `save_vip_rule_version`.
- `src/features/rules/columns/vip-rules-columns.tsx`: coluna de abrangência e ação de ativar/inativar.
- `src/features/rules/routes/rules-route.tsx`: página ajustada para regras comerciais.
- `supabase/migrations/20260709084549_commercial_prices_rules.sql`: schema comercial, checks, índices, triggers, RLS, grants e policies.
- `supabase/migrations/20260713170614_unify_permission_authorization.sql`: permissões comerciais, RLS por permissão, constraints de sobreposição, RPCs versionadas e auditoria.
- `tests/features/prices/*` e `tests/features/rules/vip-rules-service.test.ts`: cobertura de normalização, status, página e regras VIP.
- `tests/setup.ts`: isolamento de mocks e providers usados pela suíte.

## Checklist de Produção

- Aplicar a migration em ambiente Supabase com revisão de DBA antes de habilitar dados reais.
- Confirmar que `public.set_updated_at_timestamp()` existe no banco antes da migration comercial.
- Validar papéis em `app_users` para `owner`, `admin` e `auditor`.
- Não expor `service_role` nem segredo administrativo em `src/`.
- Popular `commercial_price_tables` somente com dados comerciais homologados.
- Registrar motivo em alterações de preço/regra quando houver fluxo de escrita.
- Confirmar requisitos de benefício de abastecimento antes de expor CRUD.
- Executar `pnpm validate`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:test`, `pnpm test`, `pnpm build` e `deno check` das funções antes de entrega.

## Validação Desta Revisão

- `pnpm validate`: aprovado.
- `pnpm lint`: aprovado.
- `pnpm typecheck`: aprovado.
- `pnpm typecheck:test`: aprovado.
- `pnpm test`: suíte completa aprovada.
- `pnpm build`: aprovado.
- `deno check` das funções Supabase: aprovado.

## Riscos e Dependências

- O projeto Supabase conectado não possuía tabelas comerciais reais no momento da inspeção de catálogo.
- As migrations foram criadas localmente, mas não aplicadas no banco remoto nesta revisão.
- A página de preços é preparada para produção e criação/edição passa por RPC com motivo, versionamento e auditoria.
- Regras comerciais além de VIP foram modeladas em banco para evolução, mas a UI atual preserva somente o fluxo existente de VIP.
- Valores operacionais observados no projeto antigo foram tratados como evidência histórica, não como default da nova aplicação.
