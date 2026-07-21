# Validação de Formulários, Tabelas e Filtros

## Fluxo

Formulários, tabelas, filtros e dialogs de confirmação usados nas rotas autenticadas.

## Objetivo

Padronizar a experiência operacional sem criar capacidades que o backend ou as rotas não suportam. A revisão cobre bloqueio de múltiplos submits, feedback de processamento, validação Zod, Select dentro de dialogs, mensagens finais ao usuário, badges em tabelas, dados sensíveis, ações contextuais e composição visual dos filtros/listagem.

## Levantamento forense

- `DataTable` é o contrato comum das listagens; filtros, visibilidade de coluna, exportação, tabela e paginação passam por esse componente.
- Campos sensíveis reais aparecem principalmente em usuários, clientes, veículos de cliente, unidades, usuários de unidade e solicitações de recuperação.
- Badges de status/fonte/severidade já estavam distribuídas por múltiplas features; a correção foi aplicada nas colunas de tabela sem alterar cards informativos ou históricos em dialog.
- Os dialogs com `Select`/`Combobox` usam `AppDialog` e agora mantêm `preventDialogCloseOnFloatingLayerInteraction`, evitando fechamento do dialog ao interagir com camada flutuante.
- `notify` sanitiza mensagens técnicas por regex central em `toast-utils`; nos fluxos alterados foram mantidas mensagens de fallback próprias das features.
- Não há fonte confiável nesta aplicação para revelar novos dados completos além dos valores já carregados por RLS/API. Por isso, a revelação por segurar o clique mostra somente o conteúdo que já está no payload da linha.

## Correções aplicadas

- Filtros e ações das listagens foram agrupados em bloco recolhível com título, subtítulo e ações, renderizado somente quando a tabela tem busca, filtros, ações, visibilidade de coluna ou exportação.
- O gatilho do bloco recolhível é o próprio cabeçalho de largura total, com título, subtítulo e ícone de expansão; o bloco da tabela não exibe título redundante.
- A superfície da tabela passou a ter borda única no card da listagem, sem borda interna duplicada entre tabela e card.
- Tabelas embutidas em cards existentes, como `Movimentações recentes de veículos` no dashboard, usam superfície plana e omitem o bloco de filtros quando não há controles reais.
- Colunas com badge em tabelas foram centralizadas e tiveram ordenação desabilitada explicitamente quando representam status/fonte/severidade.
- Dados sensíveis passaram a usar `DataTableSensitiveValue`, com máscara de CPF, CNPJ e telefone e revelação temporária enquanto o usuário mantém clique/tecla pressionados.
- Ações da última coluna agora escondem opções sem sentido e exibem labels contextuais como `Ativar`, `Inativar`, `Marcar como lida`, `Marcar como não lida`, `Adicionar cliente como VIP`, `Remover cliente VIP`, `Adicionar veículo como VIP` e `Remover veículo VIP`.
- `AppAlertDialog` recebeu mídia padrão, botões `size="lg"`, proteção contra duplo clique e spinner com texto durante confirmação.
- Formulários de usuários, perfil, segurança, preços, regras, pátio e recuperação foram revisados para bloqueio de submit duplicado, feedback visual e validação Zod onde o modelo da feature suporta.
- Campos reais que existiam no modelo mas não apareciam na UI foram expostos: carência/tolerância em tabelas de preço e status ativo/inativo em regras.
- O dialog de foto do perfil usa texto neutro, mantém toda a área como alvo clicável e aceita arrastar e soltar imagem no mesmo alvo.
- `AppTabs` foi ajustado para altura `h-9`, lista contida e aba ativa destacada com fundo/sombra, preservando rolagem horizontal para labels longos.

## Limites respeitados

- Não foram criadas migrations para esta refatoração de UI nem novos dados sintéticos; migrations remotas existentes foram sincronizadas para alinhar banco local e remoto.
- Não foi criada revogação, histórico, localização ou dispositivo quando a rota não oferece esse fluxo.
- Não foi adicionada edição de status em clientes/veículos sem serviço existente para esse contrato.
- Não foi exibida informação técnica bruta, token, payload de erro ou metadata sensível.

## Evidências executadas

- `pnpm exec eslint src/components/shared/app-alert-dialog.tsx src/components/data-table src/features/auth src/features/access-requests src/features/clients src/features/dashboard src/features/my-profile src/features/notifications src/features/prices src/features/reports src/features/rules src/features/security src/features/units src/features/users tests/components/data-table/data-table.test.tsx tests/features/notifications/notifications-route.test.tsx tests/features/prices/prices-route.test.tsx tests/features/rules/rules-route.test.tsx tests/features/users/users-route.test.tsx`
- `pnpm typecheck`
- `pnpm test -- tests/components/data-table/data-table.test.tsx tests/features/notifications/notifications-route.test.tsx tests/features/prices/prices-route.test.tsx tests/features/rules/rules-route.test.tsx tests/features/users/users-route.test.tsx`
- `pnpm test -- tests/components/data-table/data-table.test.tsx tests/components/sidebar/sidebar-user-menu.test.tsx tests/features/access-requests/access-requests-route.test.tsx tests/features/my-profile/my-profile-route.test.tsx`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm validate`
- `pnpm test`
- `pnpm build`

## Resultado

Validação completa aprovada em 2026-07-21:

- Lint sem erros.
- Typecheck de aplicação e testes sem erros.
- Validação de pacote aprovada com 775 arquivos, 499 arquivos de código em `src` e 47 migrations.
- Suíte completa Vitest aprovada com 41 arquivos e 155 testes.
- Build de produção concluído. O Vite manteve avisos não bloqueantes de `INEFFECTIVE_DYNAMIC_IMPORT` nas rotas de auth já conhecidas.

## Riscos residuais

- A revelação de dado sensível depende do payload recebido pela própria tabela; se a origem já vier mascarada, não há como recuperar o valor completo sem nova API.
- Fluxos ERP reais seguem dependentes de credenciais e ambiente de homologação com dados produtivos controlados.

## Status final

Concluído.
