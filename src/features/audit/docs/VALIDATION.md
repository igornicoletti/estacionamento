# Validação da entrega

## Checklist aplicado

- Raiz da feature mantendo apenas `index.ts` como arquivo solto.
- Barrels locais em `constants`, `hooks`, `model`, `routes`, `services` e `table`.
- Rota sem normalização, montagem manual de opções de filtros ou definição de colunas inline.
- Serviço sem regra visual e sem acoplamento com componentes.
- Normalização defensiva de payload externo usando `unknown` na fronteira.
- Filtros isolados em função pura.
- Colunas memoizáveis por hook dedicado.
- Nenhum `any` explícito introduzido.
- Nenhum mock introduzido.
- Nenhuma dependência paga introduzida.
- Textos de interface mantidos em português.

## Validação técnica local do pacote

O pacote foi checado com TypeScript em modo estrito usando stubs mínimos para as dependências externas da aplicação, porque o ambiente desta conversa não possui clone completo instalável do projeto. A validação verifica sintaxe, tipos locais, exports, imports internos e uso sem `any` explícito dentro do diretório entregue.

Comandos recomendados após aplicar no repositório real:

```bash
npm run typecheck
npm run lint
npm run build
npm run test -- --run
```

Se o projeto não tiver testes configurados para execução única, utilize o comando de teste previsto no `package.json` do projeto.

## Escopo de produção

A entrega foi estruturada para produção no escopo da feature `audit`. A garantia final de ausência de avisos no VSCode e no console do navegador depende da aplicação do pacote no repositório real com as dependências instaladas e execução dos scripts oficiais do projeto.
