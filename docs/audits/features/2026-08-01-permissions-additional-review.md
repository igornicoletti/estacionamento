# Revisão adicional — `src/features/permissions`

Data: 2026-08-01
Relatório forense canônico: [`../2026-08-01-permissions-feature-forensic-review.md`](../2026-08-01-permissions-feature-forensic-review.md)
Escopo desta revisão: releitura dos 22 arquivos e dos 3 testes após a auditoria canônica.

## Resultado

Não houve alteração estrutural ou comportamental na feature desde o relatório canônico. A revisão adicional confirma seus dez achados e a matriz arquivo a arquivo, especialmente:

1. leitura direta de `app_roles`, `app_permissions` e `app_role_permissions` não está alinhada à capability `permissions.read` no estado local auditado;
2. catálogo ativo diverge de `prices.manage`, `rules.manage` e `clients.sync.read` declaradas pelo frontend;
3. gateway real falha corretamente e não produz matriz sintética, mas contrato, schema superficial, adapter e composition root seguem no mesmo arquivo;
4. parser manual ainda aceita propriedades extras, não normaliza o valor retornado e descarta papéis desconhecidos;
5. `usePermissions` continua sujeito a respostas fora de ordem;
6. seis barrels, filtros/constantes inertes, copy duplicada e chave técnica humanizada continuam presentes;
7. os sete testes continuam sem cobrir adapter, schema, concorrência, Edge Function, matriz RLS e acessibilidade.

## Matriz de cobertura

Todos os arquivos abaixo foram relidos nesta revisão e mantêm a classificação e ação do relatório canônico:

- `components/index.ts`, `components/permission-access-icon.tsx`;
- `constants/index.ts`, `constants/permissions-constants.ts`, `constants/permissions-copy.ts`, `constants/permissions-labels.ts`;
- `docs/README.md`, `docs/VALIDATION.md`;
- `hooks/use-permissions-table-filters.ts`, `hooks/use-permissions.ts`;
- `index.ts`;
- `model/index.ts`, `model/permissions-details-model.tsx`, `model/permissions-parsers.ts`, `model/permissions-rules.ts`, `model/permissions-types.ts`;
- `routes/permissions-route.tsx`;
- `services/index.ts`, `services/permissions-gateway.ts`, `services/permissions-service.ts`;
- `table/index.ts`, `table/permissions-columns.tsx`.

## Decisão para implementação

A implementação deve seguir as ondas e critérios de aceite do relatório canônico. Nenhuma correção isolada de UI deve preceder a correção do catálogo/grants e a definição da fonte canônica de origem/criticidade, pois isso apenas consolidaria dados potencialmente enganosos.