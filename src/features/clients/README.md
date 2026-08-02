# Clientes

Consulta clientes ativos e os veículos vinculados que foram persistidos pelo fluxo de sincronização do ERP. A feature não dispara sincronização nem apresenta histórico: o botão de atualização apenas refaz a leitura da fonte produtiva.

## Estrutura

- `components`: composição reutilizável das tabelas e de seus estados.
- `constants`: copy, rotas, persistência local e limites de leitura.
- `gateways`: contrato, composição e adapter Supabase.
- `hooks`: estado assíncrono e filtros derivados para React.
- `model`: tipos de domínio, normalização, apresentação e detalhes.
- `routes`: composição de navegação e seleção de detalhes.
- `schemas`: validação Zod das linhas externas do Supabase.
- `services`: casos de uso sem dependência de React.
- `table`: definição declarativa das colunas.

`index.ts` é o único contrato entre features e expõe buscas mínimas de clientes e veículos para regras comerciais. Rotas e testes internos usam imports diretos.

## Fluxo de dados

1. O adapter Supabase lê somente clientes ativos autorizados por RLS.
2. Cada página é validada por schema antes de alcançar o domínio.
3. O serviço converte o formato ERP em valores seguros e anuláveis.
4. Os hooks usam controle de geração do `useAsyncSnapshot`, impedindo que uma resposta antiga sobrescreva uma atualização mais recente.
5. A rota de veículos consulta o cliente e seus veículos diretamente por `cod_pessoa`; não baixa os catálogos completos.
6. Comboboxes comerciais pesquisam no servidor a partir de dois caracteres e recebem no máximo 50 DTOs mínimos por consulta.

As consultas paginadas possuem limite explícito. Excedê-lo gera erro visível em vez de truncamento silencioso.

## Segurança e acessibilidade

- `erp_clients` e `erp_client_vehicles` dependem respectivamente de `clients.read` e `client_vehicles.read` no banco.
- Lookups não selecionam e-mail, telefone, cidade ou campos operacionais que o controle não exibe.
- CPF/CNPJ e telefone usam o componente compartilhado de conteúdo sensível; e-mail fica oculto por padrão.
- React escapa todo texto do ERP; URLs de mapa não fazem parte desta feature.
- Estados de carregamento, erro, vazio e vazio filtrado usam os contratos compartilhados da DataTable.
- Ícones decorativos são ocultos da árvore acessível e ações possuem rótulos textuais.

## Testes essenciais

- schemas rejeitam identificadores inseguros e payloads inválidos;
- serviços convertem wire data em domínio sem sucesso sintético;
- hooks/rotas preservam atualização, erro, vazio, filtros, detalhes e navegação;
- o gateway de veículos prova paginação por cliente sem depender do limite global do PostgREST.

## Referências

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [shadcn/ui Empty](https://ui.shadcn.com/docs/components/radix/empty)
