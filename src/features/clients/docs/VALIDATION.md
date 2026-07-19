# Validação — src/features/clients

Executado no pacote isolado:

```bash
npx tsc -p validation/tsconfig.json
unzip -t estacionamento-feature-clients-refatorado.zip
```

Executar após aplicar no projeto real:

```bash
pnpm typecheck
pnpm exec eslint . --max-warnings=0
pnpm test
pnpm build
```

Validar no navegador:

- rota `/clientes`;
- rota `/clientes/:cod_pessoa`;
- sincronização manual;
- histórico de sincronização;
- filtros de status, VIP e placa;
- paginação;
- empty state inicial;
- empty state filtrado;
- detalhes de cliente;
- detalhes de veículo;
- toggle VIP conforme permissão;
- console sem erro e sem warning.
