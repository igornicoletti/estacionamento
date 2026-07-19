# hooks

Hooks compartilhados da camada frontend.

## Arquivos

- `use-async-snapshot.ts`: carga assíncrona com cache leve, erro padronizado e `refetch`.
- `use-controllable-open.ts`: estado controlado/nao controlado para dialogos e drawers.
- `use-media-query.ts`: leitura reativa de media query via `useSyncExternalStore`.
- `use-mobile.ts`: atalho semantico para breakpoint mobile, baseado em `use-media-query`.

## Decisoes

- O diretorio deve ser mantido.
- `useIsMobile` foi simplificado para reutilizar `useMediaQuery`, removendo duplicacao de listener e estado.
- `useAsyncSnapshot` continua como hook-base de leitura assíncrona compartilhada entre features.

## Auditoria forense

- Nao foram encontrados hooks mortos no diretorio.
- Havia duplicacao funcional entre `use-mobile` e `use-media-query`; isso foi consolidado.
- A estrutura atual favorece reutilizacao e previsibilidade sem inflar features individuais.
