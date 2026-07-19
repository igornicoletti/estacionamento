# Validação — Notifications

Validação aplicada no artefato isolado:

```bash
npx tsc -p validation/tsconfig.json
unzip -t /mnt/data/estacionamento-feature-notifications-refatorado.zip
```

Validação necessária após aplicar no projeto real:

```bash
pnpm typecheck
pnpm exec eslint . --max-warnings=0
pnpm test
pnpm build
pnpm dev
```

Checklist no navegador:

- Nenhum warning no console.
- `NotificationsProvider` carregado dentro de `AppProviders`.
- Rota `/notificacoes` renderiza sem loop.
- Estado vazio usa `AppEmptyState`.
- Busca global, filtros, paginação e colunas funcionam.
- Ações de lida/não lida não disparam requisições duplicadas.
- Links externos ou malformados não são renderizados como destino navegável.
