# Relatórios

Feature responsável pela exploração analítica por unidade em abas especializadas.

## Estrutura

- `constants/`: textos e labels da feature.
- `model/`: contratos dos relatórios por aba.
- `services/`: acesso a dados (mock/API).
- `hooks/`: estado e carregamento de snapshot.
- `components/`: renderização das abas e tabelas.
- `routes/`: rota principal de relatórios.

## Estratégia atual

- Separação por domínio para reduzir redundância:
  - movimentação de veículos;
  - faturamento;
  - ocupação e alertas.
- Pronto para evolução de filtros por aba e exportações por conjunto.
