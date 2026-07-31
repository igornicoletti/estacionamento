# Read model operacional — contrato adiado

O projeto não possui hoje tabelas, RPCs ou gateways produtivos capazes de fornecer o read model de Dashboard, Relatórios, Pátio e Capturas. A implementação anterior de normalização operacional não tinha consumidores e modelava uma API inexistente; por isso foi removida em 2026-07-31.

## Evidência necessária antes de implementar

- fonte efetiva das capturas de entrada/saída e seu identificador idempotente;
- vínculo entre unidade, câmera, cliente, veículo, permanência e cobrança;
- semântica de leituras incompletas, duplicadas, fora de ordem e corrigidas;
- timezone e instante canônico dos eventos;
- autorização por unidade e retenção de dados/imagens;
- paginação, filtros e limites reais das consultas;
- contrato de ocupação/capacidade e atualização em tempo real;
- classificação financeira validada pelo domínio, não inferida pela UI.

## Fronteira futura

Quando o backend existir, payloads externos deverão ser validados em `schemas`, normalizados em tipos de domínio sob `model` e consultados por um gateway real. Dashboard e Relatórios deverão consumir o mesmo read model; Pátio poderá ter uma projeção especializada, sem duplicar regras.

Fixtures permanecerão em `tests/` e serão injetadas explicitamente. Nenhuma rota produtiva poderá usar fallback sintético.

`parking-movement-formatters.ts` foi mantido temporariamente porque ainda é consumido pelos previews de desenvolvimento. Ele deve ser revisto ou substituído junto com o futuro contrato real.
