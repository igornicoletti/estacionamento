# src/features/units

Feature responsável por unidades sincronizadas do ERP, funcionários vinculados por unidade,
configuração operacional de pátio e histórico de sincronização.

## Estrutura

- `constants`: textos, labels, mensagens e chaves técnicas/persistência da feature.
- `model`: contratos, normalização, formatação, validação Zod e detalhes exibidos no sheet.
- `services`: gateways Supabase/mock, serviços de unidades, pátio, sincronização e histórico.
- `hooks`: snapshots assíncronos, mutações serializadas e filtros de tabela.
- `table`: colunas das tabelas de unidades e funcionários.
- `components`: dialogs específicos da feature.
- `routes`: composição das páginas e integração entre hooks, tabela, dialogs, detalhes,
  sincronização e histórico.

## Decisões

- A raiz da feature mantém somente `index.ts` para evitar arquivos soltos.
- As rotas fazem composição de tela e orquestração operacional, mas não fazem parsing,
  sanitização ou normalização de payload externo.
- Parsing, sanitização e normalização de dados externos permanecem concentrados em
  `model` e `services`.
- A configuração de pátio usa validação Zod e validação defensiva no service.
- O service de unidades falha explicitamente quando Supabase não está configurado,
  evitando empty state falso por falha silenciosa.
- O gateway mantém o mock apenas quando `VITE_ERP_CATALOG_MOCK_ENABLED` estiver habilitado.
- As tabelas recebem dados já normalizados e snapshots derivados pela rota, evitando que
  colunas dependam de estado externo não materializado na linha.
- Textos, labels, mensagens de erro e empty states ficam centralizados em
  `constants/units-copy.ts`, reduzindo hardcoded text nas telas.
- Constantes técnicas de sincronização ficam centralizadas em `constants/units-sync.ts`,
  evitando contratos mágicos soltos nos services.
- Tokens técnicos de UI específicos da feature ficam centralizados em `constants/units-ui.ts`.
- O histórico de sincronização separa normalização, gateway mock, gateway Supabase e
  service para manter responsabilidades claras entre persistência, validação e API de domínio.
