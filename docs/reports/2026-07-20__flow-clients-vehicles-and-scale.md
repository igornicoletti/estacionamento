# Validação de Fluxo — Clientes, Veículos e Escala

## Fluxo

Listagem de clientes ativos, navegação para veículos e sincronização em alto volume.

## Objetivo

Garantir integridade funcional e robustez para 30k+ clientes ativos.

## Evidências executadas

- Testes validados: `tests/features/clients/clients-route.test.tsx`, `tests/features/clients/client-sync-service.test.ts`, `tests/features/clients/clients-service.test.ts`.
- Revisão de navegação de coluna `Veículos` para `/clientes/:cod_pessoa`.
- Aumento de limite de lotes em `src/features/clients/constants/clients-constants.ts`.
- Hardening de chunk upsert em `supabase/functions/clients-sync/index.ts`.

## Resultado

- Fluxo clientes -> veículos funcional.
- Melhor robustez para volume alto sem limite artificial baixo no frontend.

## Falhas encontradas

- Sem execução de carga real com massa produtiva nesta rodada.

## Riscos e vulnerabilidades

- Diff por hash em massa extrema pode degradar; fallback já aplicado para preservar execução.

## Melhorias recomendadas

1. Bench de carga com massa de 30k ativos + veículos.
2. Estratégia de cursor incremental quando ERP suportar.

## Status final

Aprovado para ambiente local/mocked com hardening aplicado.
