# Rules

Módulo responsável pela leitura, exibição e manutenção de regras comerciais.

## Padrão aplicado

- `constants/`: textos, chaves de persistência e limites do módulo.
- `model/`: tipos, normalização, validação e formatação do domínio.
- `services/`: fronteira Supabase e RPC de gravação transacional.
- `hooks/`: estado assíncrono consumido pela rota.
- `table/`: colunas e opções de filtro da DataTable.
- `components/`: formulários específicos da feature.
- `routes/`: composição da página.
- `index.ts`: barrel público único da feature.

## Decisões

O formulário valida os requisitos mínimos antes de qualquer requisição. A normalização protege a interface contra payloads parciais ou campos inesperados retornados pelo Supabase. A escrita usa `save_commercial_rule_version`, mantendo regra de negócio e versionamento no banco.
