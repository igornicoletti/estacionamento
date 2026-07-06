# Refactor Checklist

> Escopo: mock funcional por enquanto, sem banco. A lista abaixo foca em estabilidade, consistência, reutilização, limpeza estrutural e preparação para a fase de BD.

## Como usar

- `P0`: bloqueia a base, risco alto de bug ou inconsistência.
- `P1`: importante para manutenção, escalabilidade ou qualidade de UX.
- `P2`: melhoria de limpeza, consistência ou ergonomia.

## src/app/router

- [x] `P0` Consolidar padrões de loading/error/empty em rotas públicas, protegidas e fallback.
- [x] `P1` Verificar consistência entre `route-definitions`, `routes.tsx` e `default-route-redirect.tsx`.
- [x] `P1` Garantir que `not-found-route.tsx` e `route-access-denied.tsx` usem a mesma linguagem visual e de copy.
- [x] `P2` Revisar textos de ajuda e subtítulos para evitar redundância entre páginas.

## src/components/data-table

- [x] `P0` Persistência de visibilidade por tabela via `columnVisibilityStorageKey`.
- [x] `P0` Unificar a estratégia de snapshot para filtros, seleção e paginação quando houver necessidade de persistência futura.
- [x] `P1` Revisar a API do `DataTable` para reduzir props duplicadas entre modo controlado e não controlado.
- [x] `P1` Validar se o padrão de `emptyState` e `filteredEmptyState` cobre todos os cenários de negócio.
- [x] `P2` Extrair helpers adicionais para reduzir blocos repetidos em toolbar, filtros e actions.

## src/components/page

- [x] `P1` Header compartilhado unificado com `PageHeader`.
- [x] `P2` Rever consistência de espaçamento e hierarquia tipográfica em todas as páginas.

## src/components/sidebar

- [x] `P0` Popover de notificações com ações consistentes e fallback vazio.
- [x] `P1` Revisar a composição do sidebar para reduzir dependência de textos/labels locais.
- [x] `P2` Validar acessibilidade de atalhos de teclado e estados focais.

## src/components/toast

- [x] `P1` Padronizar mensagens de sucesso/erro em pt-BR com tom consistente.
- [x] `P2` Garantir que todas as operações assíncronas relevantes emitam feedback uniforme.

## src/config

- [x] `P0` Manter validação forte de ambiente no client sem expor segredo ou credenciais técnicas.
- [x] `P1` Confirmar que as mensagens de erro de ambiente estão sanitizadas e claras para o usuário.
- [x] `P2` Revisar nomes de variáveis e defaults para melhorar previsibilidade em dev/local.

## src/features/auth

- [x] `P0` Garantir que todo fluxo de autenticação preserve separação entre UI, validação e chamada de serviço.
- [x] `P0` Revisar tratamento de erro genérico para não vazar detalhe técnico, mas manter observabilidade interna.
- [x] `P1` Consolidar schemas e cópias de erro para reduzir divergência entre login, recuperação e troca de senha.
- [x] `P1` Revisar componentes de senha/passkey para manter acessibilidade e reutilização.
- [x] `P2` Padronizar legendas, labels e descrições com pt-BR revisado.

## src/features/audit

- [x] `P1` Hooks de carregamento refatorados para reduzir duplicação de snapshot.
- [x] `P1` Revisar se filtros/exportação continuam alinhados ao mock funcional até a fase de BD.
- [x] `P2` Padronizar mensagens de erro, export e ações em lote.

## src/features/clients

- [x] `P1` Resolver snapshot compartilhado para clientes e veículos.
- [x] `P0` Preparar camada de serviço para sair do mock em memória para a fase de banco.
- [x] `P1` Revisar normalizadores e tipos para evitar duplicação entre clientes e veículos.
- [x] `P1` Garantir que regras de VIP estejam centralizadas entre tabela, serviço e ações.
- [x] `P2` Rever textos de UI para remover qualquer exposição de dado técnico.

## src/features/notifications

- [x] `P0` Lista de notificações restrita a não lidas no popover, com ação de marcar todas como lida.
- [x] `P1` Snapshot compartilhado para carregamento/refetch/update/subscription.
- [x] `P1` Unificar regras entre popover e tela completa para evitar divergência de comportamento.
- [x] `P1` Revisar estratégia de concorrência para ações em lote caso o mock evolua para backend real.
- [x] `P2` Padronizar labels, contadores e estados vazios.

## src/features/permissions

- [x] `P0` Coluna `Chave` removida da tabela de perfis e permissões.
- [x] `P1` Colunas de perfis com ordenação removida e header centralizado.
- [x] `P1` Garantir que o detalhe/drawer não exponha dados técnicos desnecessários.
- [x] `P1` Revisar o modelo da matriz para permitir evolução sem duplicar labels/códigos.
- [x] `P2` Padronizar copies de acessibilidade e estados vazios.

## src/features/prices

- [ ] `P1` Revisar o motivo de existência do módulo no mock funcional e alinhar escopo.
- [ ] `P2` Remover código morto ou hooks/componentes não utilizados.

## src/features/rules

- [ ] `P1` Consolidar regras VIP por domínio (cliente/veículo) com contratos claros.
- [ ] `P1` Revisar persistência/mutação no mock para facilitar migração futura para BD.
- [ ] `P2` Padronizar filtros, labels e ações de tabela.

## src/features/settings

- [x] `P1` Remoção de setState em render e sincronização via remount controlado.
- [x] `P1` Cleanup de Object URL no avatar upload.
- [x] `P1` Extrair componentes menores para reduzir densidade da seção de preferências.
- [x] `P1` Consolidar copy e comportamento dos diálogos de senha/MFA.
- [x] `P2` Revisar comentários temporários e reduzir ruído no arquivo.

## src/features/units

- [x] `P1` Resolver snapshot compartilhado para users/unidade e pátio.
- [x] `P1` Persistência de visibilidade nas tabelas de unidades e usuários da unidade.
- [x] `P0` Preparar a camada para futura persistência em banco sem duplicar regras do ERP.
- [x] `P1` Consolidar filtros e mapeamentos de unidade em helpers puros.
- [x] `P1` Revisar duplicação entre services, hooks e routes no fluxo de pátio.
- [x] `P2` Padronizar nomenclatura de campos e mensagens de erro no contexto operacional.

## src/features/users

- [x] `P1` Formulário do diálogo alinhado à estrutura atual sem envolver `DialogFooter` em `form`.
- [x] `P1` Remoção de validação redundante no submit e uso do resolver como fonte principal.
- [x] `P0` Preparar o domínio para a futura fase de BD, trocando mocks locais por integração real.
- [x] `P1` Consolidar schema, types, service e UI para reduzir drift de contrato.
- [x] `P1` Revisar filtros, labels e ações de bloqueio/reset para manter consistência de copy.
- [x] `P2` Remover qualquer mensagem sem acento ou com tom técnico desnecessário.

## src/lib

- [x] `P0` Revisar helpers críticos de export, formatters e validação para garantir que não carreguem responsabilidades de feature.
- [x] `P1` Consolidar funções de normalização e identificação em helpers compartilhados quando houver repetição.
- [x] `P2` Eliminar qualquer utilitário pouco usado que esteja aumentando superfície sem benefício claro.

## src/hooks

- [x] `P1` Padronizar hooks compartilhados para evitar duplicação entre features e melhorar testabilidade.

## tests

- [x] `P0` Cobrir os fluxos mais críticos de auth, users, notifications e permissions.
- [x] `P1` Adicionar testes para os hooks de dados com cenários de refetch, cancelamento e erro.
- [x] `P1` Cobrir o comportamento do popover de notificações e dos dialogs de formulário.
- [x] `P2` Garantir snapshots/integrações mínimas para rotas e empty states.

## docs

- [x] `P1` Checklist por diretório criado para acompanhamento da refatoração.
- [ ] `P1` Atualizar documentação de auditoria e validação quando a fase de BD iniciar.
- [x] `P2` Revisar documentos antigos para remover divergências com o estado atual do código.

## supabase

- [ ] `P0` Quando a fase de BD começar, criar migrations e validar execução remota antes de concluir qualquer mudança de schema.
- [ ] `P1` Definir estratégia de migração incremental para substituir mocks em memória por persistência real.
- [ ] `P1` Mapear quais serviços precisam virar edge functions, queries ou políticas.
- [ ] `P2` Atualizar configurações e tipos gerados após cada mudança de schema.

## scripts

- [ ] `P1` Revisar scripts de validação para cobrir lint, typecheck e checks de consistência do mock funcional.
- [ ] `P2` Simplificar scripts duplicados ou sem uso claro.

## public

- [x] `P2` Verificar se assets estáticos estão alinhados com branding e não carregam arquivos obsoletos.

## Checklist de revisão contínua

- [ ] `P0` Não introduzir qualquer `setState` síncrono em render ou efeito sem necessidade clara.
- [ ] `P0` Evitar expor identificadores técnicos na UI quando houver alternativa amigável.
- [ ] `P1` Manter copies em pt-BR com acentuação revisada e linguagem consistente.
- [ ] `P1` Preferir helpers puros e snapshots compartilhados a duplicação de filtro/mapeamento.
- [ ] `P2` Remover comentários de manutenção ou sentinelas quando a estrutura estiver estável.
