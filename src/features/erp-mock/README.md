# ERP Mock

Catálogo sintético usado somente em desenvolvimento quando `VITE_ERP_CATALOG_MOCK_ENABLED=true`.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `erp-catalog-mock-data.ts` | Define unidades, clientes e veículos sintéticos compatíveis com os payloads do ERP atual. |
| `index.ts` | Expõe a API pública do mock para os gateways de unidades e clientes. |

## Decisão

O mock não grava dados no Supabase e não substitui o fluxo de sincronização. Ele serve apenas para destravar telas e formulários dependentes de `erp_units`, `erp_clients` e `erp_client_vehicles` enquanto o token do ERP não está disponível.
