# shared

Componentes reutilizaveis de composicao da aplicacao.

## Arquivos

- `app-alert-dialog.tsx`: confirmacoes com acao assíncrona, estado pending e footer padrao.
- `app-details-sheet.tsx`: apresentacao padronizada de pares `label/value` em painel lateral.
- `app-dialog.tsx`: shell de dialogo com header, body scrollavel e footer opcional.
- `app-drawer.tsx`: shell equivalente ao dialogo para drawer.
- `app-empty-state.tsx`: estado vazio padronizado com media, titulo, descricao e acoes.
- `app-password-field.tsx`: campo de senha com toggle de visibilidade, descricao e erro integrados.
- `app-responsive-dialog-drawer.tsx`: alterna entre dialog e drawer conforme media query.
- `app-sheet.tsx`: shell padrao para sheets laterais.
- `index.ts`: superficie publica do diretorio.

## Conclusao forense

- O diretorio deve ser mantido.
- Nao ha evidencia de abstracoes artificiais ou de fragmentacao desnecessaria.
- Os componentes possuem alta reutilizacao transversal entre `app/`, `sidebar/`, `data-table/` e multiplas `features/`.
- A separacao atual reduz duplicacao de markup e copy estrutural em dialogs, sheets, estados vazios e campos de senha.

## Decisoes arquiteturais

- `AppDialog`, `AppDrawer` e `AppSheet` continuam separados porque representam primitives diferentes da interface, apesar de compartilharem o mesmo objetivo de composicao.
- `AppResponsiveDialogDrawer` faz sentido como adaptador de viewport; ele nao substitui `AppDialog` nem `AppDrawer`.
- `AppDetailsSheet` deve continuar desacoplado das features e receber apenas itens prontos para renderizacao.
- `AppEmptyState` deve permanecer como padrao unico para estados vazios, erro de carregamento e listas filtradas sem resultado.
- `AppPasswordField` centraliza acessibilidade e UX de senha; duplicar esse padrao nas features aumentaria inconsistencias.

## Oportunidades de melhoria futuras

- Extrair um helper compartilhado de `isRenderable` se novos componentes do diretorio continuarem repetindo essa logica.
- Manter imports preferencialmente pelo barrel `@/components/shared` quando nao houver necessidade de path direto.
- Evitar adicionar componentes de dominio neste diretorio; `shared` deve continuar restrito a composicao transversal.
