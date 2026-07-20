# Validação de Fluxo — Usuários, Perfis e Unidade

## Fluxo

Cadastro/edição de usuários, permissões por perfil e vinculação de gerente/operador à unidade.

## Objetivo

Confirmar coerência entre tabela de usuários, tabela de unidades e acessos por perfil.

## Evidências executadas

- Testes validados: `tests/features/users/users-route.test.tsx`, `tests/features/users/users-service.test.ts`, `tests/features/units/units-route.test.tsx`, `tests/features/units/unit-users-route.test.tsx`.
- Revisão de cálculo de funcionários por unidade (`manager` e `operator`).

## Resultado

- Coluna de funcionários em unidades condizente com referência de `unitId` em usuários.
- Distinção gerentes/operadores presente no details da unidade.
- Navegação para funcionários da unidade funcional (`/unidades/:cod_empresa/usuarios`).

## Falhas encontradas

- Não há evidência local de criação de usuário em TODOS os perfis com backend externo real nesta rodada.

## Riscos e vulnerabilidades

- Risco de regra de negócio: contagem de funcionários considera vínculo por unidade e perfil, mas não diferencia ativo/inativo na métrica agregada.

## Melhorias recomendadas

1. Definir política de contagem (todos vs somente ativos) e fixar em teste.
2. Criar suite E2E com criação por perfil (owner/admin/auditor/manager/operator).

## Status final

Aprovado para consistência local/testes; validação E2E completa por perfil pendente.
