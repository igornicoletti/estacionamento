# Unidades

## Objetivo

Feature responsável por unidades sincronizadas do ERP, funcionários vinculados por unidade e configuração operacional de pátio.

## Estrutura

```text
src/features/units/
├── components/
├── constants/
├── docs/
├── hooks/
├── model/
├── routes/
├── services/
├── table/
└── index.ts
```

## Decisões

- A raiz da feature mantém somente `index.ts`.
- Rotas compõem tela e orquestração, sem parsing direto de payload externo.
- Parsing, sanitização e normalização ficam em `model` e `services`.
- O serviço real `unit-sync-service.ts` permanece testado como contrato do disparo da Edge Function.
- UI, hooks, gateways de histórico e runners sem consumidor foram removidos em 2026-07-31; não existe mais uma feature genérica `src/features/sync`.
- A leitura do ERP passa pelo gateway da feature, com validação e sanitização antes de chegar às rotas.
- A configuração de pátio usa validação Zod, estado otimista serializado e validação defensiva no service.
- Tabelas recebem dados normalizados e estados derivados já materializados na rota.
- Textos e mensagens permanecem centralizados em `constants/units-copy.ts`.
- Constantes técnicas de sincronização permanecem centralizadas em `constants/units-sync.ts`.
- Barrels são pontos de entrada externos; imports internos usam caminhos diretos para reduzir ciclos.
