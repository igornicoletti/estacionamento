# Validação da feature permissions

Comandos executados no pacote isolado:

```bash
npx tsc -p validation/tsconfig.json
unzip -t /mnt/data/estacionamento-feature-permissions-refatorado.zip
```

Verificações estruturais:

- Raiz de `src/features/permissions` contém somente `index.ts`.
- Código de produção sem `any`.
- Código de produção sem `console.*`, `debugger`, `TODO`, `FIXME` ou `HACK`.
- `MANIFEST.json` validado contra os arquivos reais do pacote.
