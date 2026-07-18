# Validação de entrega — src/app

## Checklist aplicado

- A raiz do diretório contém somente `index.ts`.
- `app-copy` e `app-providers` foram preservados como caminhos compatíveis via diretórios com `index`.
- O registry de rotas foi separado dos lazy loaders.
- O layout autenticado mantém `SidebarProvider`, `AppSidebar`, `SidebarInset`, `AppHeader` e `Outlet`.
- Estados de rota usam `Spinner` e `AppEmptyState`.
- Não há marcadores de pendência conhecidos nos arquivos entregues.

## Comandos recomendados após aplicar no projeto

```bash
npm run typecheck
npm run lint
npm run build
```

## Observação operacional

A validação local do artefato confirma estrutura, sintaxe TypeScript e integridade do ZIP. A validação final de navegador deve ser executada no projeto real, com dependências instaladas e variáveis de ambiente locais.
