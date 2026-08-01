# Unidades

Consulta o catálogo de unidades do ERP, as configurações persistidas de pátio e, quando o usuário possui `users.read`, os totais agregados de funcionários por unidade.

## Estrutura

- `components`: tabelas de unidades e funcionários com estados completos.
- `constants`: copy, rotas, persistência local e limites de leitura.
- `gateways`: contratos, composition roots e adapters Supabase.
- `hooks`: snapshots assíncronos, composição da tabela e filtros.
- `model`: domínio, normalização, formatação, detalhes e read model da tabela.
- `routes`: navegação e seleção de detalhes, sem regras de acesso ao banco.
- `schemas`: validação Zod das respostas externas.
- `services`: casos de uso independentes de React.
- `table`: colunas e ações declarativas.

`index.ts` é o único contrato entre features. Ele expõe o catálogo e a leitura de pátio consumidos por `users`, pelo seletor global e pelos previews operacionais. Gateways e rotas permanecem internos.

## Fluxo de dados

1. `useUnits` carrega apenas o catálogo de unidades.
2. `useUnitYardConfigs` carrega configurações reais; ausência permanece `null` e aparece como “Não configurado”.
3. `useUnitUserStats` chama a RPC agregada somente quando `users.read` foi concedida. A UI não inventa contagens zero para respostas parciais.
4. `useUnitTableRows` combina os snapshots e propaga qualquer falha necessária à tabela.
5. A rota de funcionários resolve a unidade diretamente por ID; não baixa todas as unidades para compor o cabeçalho.

As leituras de lista são paginadas e falham explicitamente ao alcançar o limite de segurança. O domínio preserva os textos do ERP, limitando a normalização a espaços, CNPJ e UF; correções especulativas de acentuação não são aplicadas.

## Segurança

- `erp_units` e `unit_yard_configs` exigem `units.read` via RLS.
- a RPC `list_unit_user_stats` exige `users.read` dentro de uma função protegida; a aplicação não agrega linhas parcialmente visíveis de `app_user_units`.
- alterações de pátio exigem `units.yard.manage`, registram `updated_by` no banco e geram evento de auditoria.
- a aplicação atual é somente leitura para pátio; nenhum formulário ou gateway de escrita dormente é mantido.
- CNPJ é exibido pelo componente compartilhado de conteúdo sensível; coordenadas usam URL codificada e `rel="noreferrer"`.

## Testes essenciais

- schemas rejeitam IDs fora do intervalo seguro, contagens negativas e payloads incompletos;
- gateways confirmam paginação, consulta direta e validação de RPC;
- serviços e hooks distinguem configuração ausente, falha e valor zero real;
- rotas cobrem atualização, vazio, vazio filtrado, detalhes, permissão de usuários e navegação;
- contratos SQL verificam grants mínimos, policies por permissão, autoria do pátio e acesso à RPC.

## Referências

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [shadcn/ui Empty](https://ui.shadcn.com/docs/components/radix/empty)
