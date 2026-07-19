# Validação

Validações executadas no pacote isolado:

- TypeScript estrito com `npx tsc -p validation/tsconfig.json`.
- Integridade do ZIP com `unzip -t`.
- Manifest validado contra hash e tamanho reais dos arquivos.
- Verificação de raiz da feature contendo somente `index.ts`.
- Varredura de produção para tipagem insegura, logs de desenvolvimento, pontos de depuração e marcadores de pendência.

A validação final de integração deve ser executada no projeto real com `pnpm typecheck`, `pnpm exec eslint . --max-warnings=0`, `pnpm test` e `pnpm build`.
