# Rules

Feature responsável por listar, consultar e cadastrar regras comerciais VIP.

## Decisões

- A fonte de dados é a tabela `commercial_rules`.
- Não há fallback em `localStorage` nem gateway de memória no código de produção.
- A autorização real de escrita permanece nas policies RLS de `commercial_rules`.
- A rota usa `DataTable` apenas como tabela genérica.
- Detalhes usam `AppDetailsSheet`.
- Estados vazios usam `AppEmptyState`.
- Cadastro usa `AppDialog` com formulário controlado.
- Ações de criação e ativação são exibidas apenas para `owner` e `admin`.

## Estrutura

```txt
src/features/rules/
├── columns
├── components
├── hooks
├── routes
├── services
├── types
├── utils
├── index.ts
├── rules-copy.ts
└── README.md
```

## Validação

```powershell
npm run typecheck
npm run lint
npm run build
```
