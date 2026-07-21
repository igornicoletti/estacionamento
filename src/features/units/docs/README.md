# Unidades

## Objetivo

Feature responsável por unidades sincronizadas do ERP, funcionários vinculados por unidade, configuração operacional de pátio e histórico de sincronização.

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
- Histórico e bloqueio de sincronização são autocontidos na feature para remover dependência de `src/features/sync`.
- O mock de ERP permanece centralizado em `src/features/erp-mock` e é usado apenas quando a flag de mock estiver habilitada.
- A configuração de pátio usa validação Zod, estado otimista serializado e validação defensiva no service.
- Tabelas recebem dados normalizados e estados derivados já materializados na rota.
- Textos e mensagens permanecem centralizados em `constants/units-copy.ts`.
- Constantes técnicas de sincronização permanecem centralizadas em `constants/units-sync.ts`.
- Barrels são pontos de entrada externos; imports internos usam caminhos diretos para reduzir ciclos.
