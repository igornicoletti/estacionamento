# page

Primitivas de layout para paginas autenticadas.

## Responsabilidades

- Padronizar espacamento vertical entre cabecalho, filtros, tabela e blocos de conteudo.
- Padronizar estrutura de titulo/subtitulo/acoes de pagina.
- Evitar duplicacao de classes utilitarias em cada rota.

## Arquivos

- `page-section.tsx`: container principal de pagina com `flex`, `gap` e animacao de entrada.
- `page-header.tsx`: cabecalho padrao com titulo, subtitulo e area de acoes.
- `page-header-actions.tsx`: grid/flex responsivo para grupos de botoes no cabecalho.
- `index.ts`: superficie publica do diretorio.

## Decisao arquitetural

Esses componentes devem ser mantidos.

A auditoria mostrou uso amplo em multiplas rotas de features e um contrato visual estavel. Remover essas primitivas agora aumentaria duplicacao de markup e classes utilitarias, elevando a chance de divergencia futura entre paginas.

## Uso recomendado

- Use `PageSection` como container raiz da rota autenticada.
- Use `PageHeader` para titulo e subtitulo da pagina.
- Use `PageHeaderActions` quando houver mais de uma acao no topo.
- Ajustes especificos de largura ou padding devem ser passados por `className`, sem duplicar a estrutura base.
