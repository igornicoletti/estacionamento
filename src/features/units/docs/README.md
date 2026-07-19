# src/features/units

Feature responsável por unidades sincronizadas do ERP, funcionários vinculados por unidade, configuração operacional de pátio e histórico de sincronização.

## Estrutura

- `constants`: textos, labels, mensagens e chaves de persistência da tabela.
- `model`: contratos, normalização, formatação, validação Zod e detalhes exibidos no sheet.
- `services`: gateways Supabase/ERP mock controlado por flag, serviços de unidades, pátio, sincronização e histórico.
- `hooks`: snapshots assíncronos, mutações serializadas e filtros de tabela.
- `table`: colunas das tabelas de unidades e funcionários.
- `components`: dialogs específicos da feature.
- `routes`: composição das páginas.

## Decisões

- A raiz da feature mantém somente `index.ts` para evitar arquivos soltos.
- A configuração de pátio usa validação Zod e validação defensiva no service.
- O service de unidades falha explicitamente quando Supabase não está configurado, evitando empty state falso por falha silenciosa.
- O gateway mantém o mock apenas quando `VITE_ERP_CATALOG_MOCK_ENABLED` estiver habilitado.
- A rota não contém colunas, schemas nem parsing de payload externo.
