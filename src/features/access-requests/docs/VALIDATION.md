# Validação — Solicitações de acesso

Executar no projeto após aplicar o pacote:

```bash
pnpm typecheck
pnpm exec eslint . --max-warnings=0
pnpm test
pnpm build
pnpm dev
```

Validar manualmente:

- carregamento da rota de solicitações de acesso;
- empty state sem registros pendentes;
- busca global por telefone, e-mail e descrição;
- abertura do painel de detalhes;
- aprovação com senha temporária inválida bloqueada;
- aprovação com senha temporária válida;
- negação com confirmação destrutiva;
- reload após aprovar/negar;
- ausência de warnings no console do navegador.
