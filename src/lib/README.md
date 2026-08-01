# lib

Utilitarios compartilhados de baixo nivel.

## Organizacao atual

- Formatacao: `formatters.ts`, `phone.ts`, `cpf.ts`.
- Normalizacao e seguranca de exibicao: `normalize.ts`, `sensitive-display.ts`.
- Infra compartilhada: `supabase-browser.ts` e `errors.ts`.
- Contratos de dados externos: `schemas/source-safe-integer-schema.ts`.
- Paginação segura do PostgREST: `supabase/fetch-all-postgrest-batches.ts`.
- Predicados React reutilizáveis: `is-renderable.ts`.
- Estilo e composicao: `badge.ts`, `utils.ts`.
- `index.ts`: superficie publica do diretorio.

## Decisoes

- O diretorio deve ser mantido.
- O barrel `index.ts` continua util porque ha alto reaproveitamento transversal das funcoes expostas.
- Utilitarios de baixo nivel permanecem desacoplados de features e concentrados aqui.

## Auditoria forense

- `promise.ts` foi removido após confirmação de ausência de consumidores.
- `AppError` existe, mas o uso corrente mais frequente ainda e `Error` simples via `toError`; manter o arquivo e seguro para evolucao futura.
- `normalizeOptionalText` continua sendo uma dependencia util dos formatadores e nao deve ser incorporado manualmente em cada helper.
- `isRenderable` passou a ser a implementação única usada pelos shells compartilhados.
