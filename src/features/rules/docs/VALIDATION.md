# Validação de entrega — Rules

- Estrutura sem arquivos soltos na raiz além de `index.ts`.
- Textos e chaves movidos para `constants`.
- Colunas e filtros isolados em `table`.
- Formulário com validação local antes da requisição.
- Serviço com fronteira explícita para Supabase e tratamento de erro.
- Sem estado sendo alterado durante renderização.
