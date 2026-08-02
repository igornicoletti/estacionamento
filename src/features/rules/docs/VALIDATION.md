# Validação de entrega — Rules

- [x] Cliente e veículo usam Combobox com busca remota debounceada.
- [x] Busca exige dois caracteres, limita a 50 resultados e descarta respostas antigas.
- [x] DTO de lookup não carrega e-mail, telefone ou dados operacionais desnecessários.
- [x] Veículo selecionado deriva código, placa e cliente sem campos técnicos livres.
- [x] Unidades usam Combobox múltiplo e rótulo `código — nome`.
- [x] `status` do banco é normalizado para `active` no domínio.
- [x] Adapters `fuel_benefit ↔ fuel` e `network ↔ global` são explícitos e testados.
- [x] Rota produtiva carregada no navegador com oito registros e sem erro PostgREST.
- [x] Busca real por cliente exibiu código, nome e CNPJ sem carregar o catálogo completo.

Testes focados: 10 casos de rota/modelo e contrato de escrita aprovados.
