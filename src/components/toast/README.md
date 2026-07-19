# toast

Camada central de notificacoes da aplicacao baseada em Sonner.

## Responsabilidades

- Traduzir mensagens tecnicas para copy curta e segura.
- Sanitizar texto antes de exibir ao usuario.
- Exibir apenas feedback final de sucesso, aviso, erro ou informacao.
- Manter a configuracao visual do toaster em um unico ponto.

## Contrato de uso

- `notify.success`, `notify.error`, `notify.info` e `notify.warning` devem ser usados para feedback final.
- `notify.track` e `notify.promise` continuam disponiveis para padronizar sucesso/erro de promessas, mas nao exibem mais toast de loading.
- Loadings visuais devem ficar nos botoes de submit com `Spinner`, nao em toast.
- Mensagens tecnicas brutas de backend nao devem ser exibidas diretamente quando houver copy de fallback do dominio.

## Arquivos

- `toast-app.tsx`: configuracao global do Toaster Sonner.
- `toast.ts`: API publica `notify`.
- `toast-utils.ts`: traducao, sanitizacao e interpolacao.
- `toast-copy.ts`: dicionario base de mensagens e traducoes comuns.

## Decisoes

- O loading foi removido do fluxo visual de toast para evitar duplicidade com estados de submit.
- A sanitizacao permanece centralizada antes da renderizacao.
- A copy compartilhada cobre mensagens genericas e traducoes recorrentes.
