# Auditoria forense adicional — `src/features/clients`

Data: 2026-08-01
Estado: revisão concluída; próxima refatoração pendente
Escopo: 25 arquivos, 6 testes, fixture memory, registro de rotas e RLS/read models de clientes

## Conclusão

A feature já eliminou mocks produtivos, implementou gateway Supabase, schemas Zod, lookup direto por ID, RLS por capability e estados completos da DataTable. O browser não concatena SQL, React escapa o ERP e documentos/telefones usam componente sensível nas tabelas.

Ainda não atende integralmente a escala e a separação prometidas. A listagem busca páginas de 500 até um teto de 120 batches (60.000 linhas) e só depois filtra/pagina no cliente. Os objetos de domínio preservam nomes de wire em snake_case, e flags desconhecidas são silenciosamente tratadas como `false`. A rota de veículos consulta simultaneamente tabelas protegidas por duas capabilities, mas seu gate declara apenas `client_vehicles.read`.

## Achados

| ID | Severidade | Achado | Refatoração |
| --- | --- | --- | --- |
| CL-01 | Alta | Listagem pode carregar 60 mil clientes, PII incluída, para paginação/filtro local. | Criar request paginado/filtros server-side, total autorizado e debounce/cancelamento; baixar detalhes sensíveis somente quando necessários. |
| CL-02 | Alta | Rota de veículos exige somente `client_vehicles.read`, mas chama `findClientById` em tabela que exige `clients.read`. | Exigir ambas as capabilities ou fornecer endpoint agregado autorizado com contrato explícito. |
| CL-03 | Alta | Flags ERP desconhecidas viram `false`, podendo apresentar “sem bloqueio” ou “inativo” sem evidência. | Schema enumerado/normalizador tri-state; exibir indisponível para valor não reconhecido e registrar drift redigido. |
| CL-04 | Média | Wire e domínio compartilham nomes ERP (`cod_pessoa`, `nom_pessoa`, etc.). | Criar tipos `ErpClientRow`, `Client`, `ClientTableRow` realmente distintos, com domínio camelCase. |
| CL-05 | Média | Documento completo aparece no subtítulo da rota de veículos sem interação de revelação. | Remover PII do cabeçalho ou usar apresentação mascarada/explicitamente revelável. |
| CL-06 | Média | Schemas aceitam propriedades extras e textos sem limites defensivos. | Usar `.strict()`, limites por coluna, datas coerentes e quantidade não negativa. |
| CL-07 | Média | Gateway/hook não recebem `AbortSignal`; atualizações antigas são ignoradas, mas continuam consumindo rede/CPU. | Adicionar cancelamento mantendo generation guard. |
| CL-08 | Média | `Promise.all` consulta veículos mesmo quando o cliente é inexistente/inacessível. | Usar endpoint agregado autorizado ou resolver contrato de permissão antes de carregar dados dependentes. |
| CL-09 | Baixa | Composition root global mutável e um teste de rota não restaura o gateway. | Injeção/lifecycle seguro e `afterEach(resetClientsGateway)`. |
| CL-10 | Baixa | Testes não cobrem RLS por capability, truncamento máximo, resposta fora de ordem, abort, PII default e flags desconhecidas. | Acrescentar contratos de banco/hook/segurança/acessibilidade. |

## Segurança e privacidade

- RLS final exige `clients.read` para `erp_clients` e `client_vehicles.read` para `erp_client_vehicles`; grants foram reduzidos a SELECT para authenticated.
- Não há SQL dinâmico, HTML inseguro ou mutação do ERP no browser.
- O SELECT atual carrega CNPJ/CPF, e-mail e telefone para todas as linhas. Mesmo ocultos visualmente, os valores já estão no browser; minimização exige endpoint/list view sem PII e lookup autorizado de detalhes.
- A tabela mascara documento/telefone, mas detalhes e subtítulo podem revelar valores completos. Revelação deve ser observável, intencional e auditável se a política de dados assim exigir.
- XSS é mitigado por React; limites de texto continuam necessários para memória/layout/export.
- CSRF não se aplica à leitura bearer-token da Data API; RLS e sessão são a autoridade.

## Performance

O algoritmo atual é O(n) em transferência/memória e O(n log n) nas ordenações/facetas locais, com teto de 60.000. A evolução deve usar paginação cursor ou range controlado pelo servidor, busca normalizada e filtros indexáveis. Consultas por cliente/veículo já evitam o catálogo completo e usam ordenação determinística; o índice `(cod_pessoa, client_is_active_120d, num_placa)` é compatível com o caso principal.

## Acessibilidade/UX

Há aria-label na tabela, estados vazio/filtrado/erro/loading, ações textuais e ícones decorativos ocultos. Faltam testes de teclado/foco, reveal de PII, viewport estreito, texto longo e navegação de volta. A tela deve distinguir “cliente inexistente”, “sem permissão”, “dados parciais” e “sem veículos”; atualmente erros de capability convergem para o estado genérico.

## Matriz por arquivo

| Arquivo | Responsabilidade | Revisão/ação |
| --- | --- | --- |
| `index.ts` | API pública para regras | Estreito; manter somente consulta realmente necessária e paginada. |
| `README.md` | Contrato | Afirma separação wire/domínio que os nomes atuais não cumprem; atualizar. |
| `components/client-vehicles-table.tsx` | Tabela de veículos | Boa composição; estado “indisponível” precisa motivo tipado. |
| `components/clients-table.tsx` | Tabela de clientes | Boa composição; não deve receber catálogo completo em escala. |
| `constants/clients-copy.ts` | Copy | Centralizado. Adicionar estados forbidden/partial sem detalhes técnicos. |
| `constants/clients-persistence.ts` | Cache, visibilidade e batches | Teto de 60k é proteção insuficiente. Substituir por configuração de página. |
| `constants/clients-routes.ts` | URLs | Adequado; evitar duplicar paths do registry em próxima limpeza. |
| `gateways/clients-gateway-contracts.ts` | I/O | Falta request paginado, total, filtros e signal. Evoluir. |
| `gateways/clients-gateway.ts` | Composition root | Singleton mutável. Substituir por injeção/lifecycle seguro. |
| `gateways/supabase-clients-gateway.ts` | Queries/parse | Real e bounded, mas baixa tudo; adicionar list view mínima/paginação/abort. |
| `hooks/use-client-vehicles-table-filters.ts` | Faceta de placa | Correto no recorte local; migrar ao servidor se volume crescer. |
| `hooks/use-client-vehicles.ts` | Cliente + veículos | Parallel load sem contrato agregado/cancelamento. Refatorar. |
| `hooks/use-clients-table-filters.ts` | Facetas cidade/status | Correto localmente; servidor deve produzir options/contagens quando paginado. |
| `hooks/use-clients.ts` | Snapshot | Generation guard compartilhado; adaptar a query state paginada. |
| `model/clients-details-model.ts` | Presenter | Expõe PII completa em detalhes. Classificar/revelar conforme política. |
| `model/clients-formatters.ts` | Route/date/PII | Responsabilidade clara; invalid phone returns raw text, devendo usar indisponível. |
| `model/clients-normalizers.ts` | Wire para domínio | Mantém nomes wire e coerção booleana insegura. Refatoração prioritária. |
| `model/clients-table-mappers.ts` | Domínio para tabela | Pequeno; renomear estado para enum de domínio consistente. |
| `model/clients-types.ts` | Tipos | Snake_case demonstra mistura wire/domínio. Separar contratos. |
| `routes/client-vehicles-route.tsx` | Detalhe/lista | Capability incompleta e PII no subtitle. Corrigir. |
| `routes/clients-route.tsx` | Lista/detalhes | Rota fina; adaptar query/paginação server-side. |
| `schemas/clients-gateway-schemas.ts` | Wire Zod | Boa validação de IDs/placa; adicionar strict/limites/flags tri-state/datas. |
| `services/clients-service.ts` | Caso de uso | Simples; evoluir request/response e manter mapper fora do React. |
| `table/client-vehicles-columns.tsx` | Colunas | Documento sensível tratado; manter. Testar export e reveal. |
| `table/clients-columns.tsx` | Colunas | Boa reutilização; e-mail oculto ainda reside no payload. Minimizar origem. |

## Testes vistoriados

| Arquivo | Lacuna principal |
| --- | --- |
| `clients-details.test.tsx` | Só abertura; falta PII, foco, fechamento e teclado. |
| `clients-gateway-schemas.test.ts` | IDs/placa; falta strict, limites, flags e datas. |
| `clients-route.test.tsx` | Caminhos felizes/cliente ausente; não restaura gateway e falta erro/partial. |
| `clients-routing-config.test.ts` | Testa apenas rota de lista; adicionar ambas as capabilities da subrota. |
| `clients-service.test.ts` | Mapper feliz; falta desconhecidos/indisponíveis. |
| `supabase-clients-gateway.test.ts` | Batching/lookup; falta teto, veículos, erros, abort e query mínima. |
| `tests/helpers/clients-memory-gateway.ts` | Fixture test-only adequada; ajustar ao novo contrato paginado. |

## Critérios de aceite

- Nenhuma listagem baixa catálogo integral ou PII não necessária.
- Rota/endpoint de veículos possui autorização coerente e testada com capabilities independentes.
- Valores ERP desconhecidos permanecem desconhecidos, nunca viram “não” silenciosamente.
- Wire, domínio, formulário e tabela têm nomes/tipos distintos.
- Busca, filtros e paginação server-side preservam estados e respostas fora de ordem.
- PII não aparece por padrão; reveal/detalhe segue política e testes.
- RLS local por papel/capability, schemas, gateway, hooks, teclado/foco e viewports passam.
