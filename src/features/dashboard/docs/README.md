# Dashboard

Feature responsável pela visão operacional consolidada por unidade selecionada.

## Estrutura

- `constants/`: cópias e textos da feature.
- `model/`: contratos e estruturas de dados.
- `services/`: acesso a dados (mock/API).
- `hooks/`: composição de estado da feature.
- `components/`: blocos visuais reutilizáveis do dashboard.
- `routes/`: rota principal da feature.

## Observações

- Dados atuais estão mockados por unidade para acelerar validação de UX fora de produção.
- Em `PROD`, o service falha em vez de exibir indicadores sintéticos como dado operacional.
- Estrutura foi preparada para substituição gradual por API real sem quebra de layout.
