# Validação — src/features/clients

Validação executada sobre o pacote revisado:

- inspeção do ZIP gerado anteriormente;
- checagem de sintaxe TypeScript/TSX por transpile;
- busca por dependências residuais de sincronização legada;
- busca por toast de carregamento via promessa;
- busca por tipagem ampla nos arquivos de código;
- validação de integridade do ZIP com `unzip -t`.

Resultado aplicado no pacote revisado:

- `src/features/clients` não importa mais a feature legada de sincronização;
- `clients` possui diálogo bloqueante de sync local e runner local específico;
- telefone de cliente fica visível por padrão;
- documento em veículos fica visível por padrão;
- `ClientSyncCounters` mantém chaves explícitas;
- filtros ficam em hooks, seguindo o padrão de `units`;
- histórico de sincronização mantém gateway, mock, Supabase, normalização e types separados;
- não há toast de carregamento por promessa em `src/features/clients`;
- não há `any` nos arquivos `.ts` e `.tsx` entregues.

Executar após aplicar no projeto real:

```bash
pnpm typecheck
pnpm exec eslint . --max-warnings=0
pnpm test
pnpm build
supabase db push --dry-run
supabase db push
```

Validar no navegador:

- rota `/clientes`;
- rota `/clientes/:cod_pessoa`;
- sincronização manual;
- histórico de sincronização;
- filtros de status, VIP e placa;
- CPF/CNPJ e telefone visíveis conforme permissão;
- empty state inicial;
- empty state filtrado;
- detalhes de cliente;
- detalhes de veículo;
- toggle VIP conforme permissão;
- console sem erro e sem warning.
