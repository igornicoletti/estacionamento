# Prices

Módulo responsável pela leitura, exibição e manutenção das tabelas de preço comerciais.

## Padrão aplicado

- `constants/`: textos, chaves de persistência e limites do módulo.
- `model/`: tipos, normalização, validação e formatação do domínio.
- `services/`: fronteira de acesso ao Supabase e RPCs públicas com RLS.
- `hooks/`: adaptação dos serviços para estado assíncrono da interface.
- `table/`: colunas e opções de filtros da DataTable.
- `components/`: formulários e partes reutilizáveis específicas do módulo.
- `routes/`: composição da página.
- `index.ts`: barrel público único da feature.

## Decisões

A validação fica antes da chamada ao Supabase, a normalização fica na fronteira de leitura e as ações de escrita usam RPCs para preservar regras transacionais no banco. A tabela segue o mesmo padrão de `audit`, evitando arquivos soltos na raiz e concentrando colunas/filtros no submódulo `table`.
