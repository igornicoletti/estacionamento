# Validação — src/features/clients

Validação vigente após a onda estrutural de 2026-07-31:

- inventário de consumidores por imports estáticos e dinâmicos;
- checagem de sintaxe TypeScript/TSX;
- busca por toast de carregamento via promessa;
- busca por tipagem ampla nos arquivos de código;

Resultado aplicado no pacote revisado:

- `src/features/clients` não importa mais a feature legada de sincronização;
- `src/features/clients` não importa mais `@/features/rules` nem `useVipRules`;
- o serviço real de disparo permanece isolado e coberto por teste de concorrência;
- telefone de cliente fica visível por padrão;
- documento em veículos fica visível por padrão;
- filtros ficam em hooks, seguindo o padrão de `units`;
- `/clientes/:cod_pessoa` usa consulta direta do cliente por ID;
- leitura de VIP usa serviço local com select mínimo e não derruba a tabela quando falhar;
- UI, hooks, gateways de histórico e runners sem consumidor foram removidos;
- não há toast de carregamento por promessa em `src/features/clients`;
- não há `any` nos arquivos `.ts` e `.tsx` entregues.

Gates obrigatórios:

```bash
pnpm typecheck
pnpm typecheck:test
pnpm lint
pnpm test
pnpm build
pnpm bundle:check
```

Validar no navegador:

- rota `/clientes`;
- rota `/clientes/:cod_pessoa`;
- filtros de status, VIP e placa;
- CPF/CNPJ e telefone visíveis conforme permissão;
- empty state inicial;
- empty state filtrado;
- detalhes de cliente;
- detalhes de veículo;
- toggle VIP conforme permissão;
- console sem erro e sem warning.


## Correção final aplicada

- Corrigido import ausente de `sanitizeErpClientPayload` em `src/features/clients/services/clients-service.ts`.
- Centralizadas chaves de cache de VIP em `clients-persistence.ts`.
- Revisado barrel raiz de `clients` para consistência com `units`.
- Reexecutada validação estática isolada sobre `clients` e `units` no pacote final combinado.
