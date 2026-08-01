# Revisão forense — `src/features/reports`

Data da revisão: 2026-08-01
Escopo: 14 arquivos, teste direto, registro/lazy loading de rotas, contrato de unidade e dependência `operations`.
Estado: auditoria concluída; feature corretamente bloqueada em produção, refatoração/remoção do preview pendente.

## Parecer executivo

`reports` não é uma capacidade produtiva. O service usa fixtures de abril de 2026 e lança erro deliberadamente em `PROD`; router e navegação já a classificam como `development`, e o lazy loader produtivo não importa a rota. Essa contenção é correta e deve permanecer até existir read model autorizado.

Mesmo como preview, há falhas que impedem usá-la como base produtiva: ações “Detalhes” e textos clicáveis são renderizados sem callbacks e não têm efeito; a UI expõe três conjuntos sintéticos como se fossem relatórios analíticos; hook aceita respostas fora de ordem; copy está espalhada; não há gateway/schema, filtros de período, exportação, partialidade ou testes de autorização/acessibilidade. O service acopla `reports` diretamente à configuração de pátio de `units` e recalcula capacidade sobre percentuais fictícios.

## Funcionalidades atuais

- seleção compartilhada de unidade;
- três tabs: movimentação, faturamento, ocupação/alertas;
- busca, paginação e view options locais por DataTable;
- loading/error/retry;
- ajuste da capacidade fictícia pela configuração real de pátio em desenvolvimento;
- nenhuma fonte real, escrita, exportação ou detalhe funcional.

## Achados

### Alta

1. **Dados sintéticos:** nunca remover o gate de desenvolvimento antes de gateway/read model real, RLS/capability e schema. Fixtures devem permanecer test/dev explícito.
2. **Controles sem efeito:** factories sempre criam botão/texto/ação de detalhes, mas `ReportsTabsContent` não passa `onOpenDetails`. Isso viola affordance e acessibilidade; remover controles ou implementar Sheet funcional.
3. **Concorrência:** o hook usa ref + boolean local só no efeito. `refetch` e mudança de unidade podem concluir fora de ordem e aplicar snapshot da unidade anterior. Adicionar generation guard/cancelamento.

### Média

4. `defaultUnitId = 7` ainda permite fallback quando chamada programaticamente com null; contexto sem unidade deve ficar explicitamente indisponível.
5. Service consulta yard config real para modificar fixture; mistura dados de naturezas diferentes e pode legitimar números falsos.
6. Deep import `reports -> operations` usa uma falsa feature composta apenas por formatadores; contrato deve pertencer ao read model operacional real.
7. Todos os filtros/paginação são client-side e não há período. Relatórios reais exigem paginação/cursor, agregação server-side e limites/export assíncrono.
8. Tipos são apenas compile-time; não há schemas Zod, validação de percentuais, datas, dinheiro, placa, capacidade ou consistência `available <= capacity`.
9. Copy/hardcodes estão em tabs/columns/hook/service apesar de `reportsCopy` existir.
10. `stayMinutes = 0` aparece como vazio por checagem truthy.
11. Datas usam locale do navegador sem timezone de negócio; `referenceDate` é exibida crua.
12. Placas, câmeras, faturamento e regras/preços são dados sensíveis; futuro endpoint deve aplicar escopo de unidade e minimização, sem depender do seletor do cliente.

### Baixa

13. Barrel de components/table cria caminhos alternativos; não há índice público, resultando em padrão inconsistente.
14. `ReportsTabKey` não é usado.
15. README diz “mock/API” e “pronto para evolução”, mas falta registrar exclusão do bundle produtivo e todos os contratos pendentes.
16. Teste único cobre apenas capacidade e ausência de fallback explícito; não cobre UI.

## Segurança e privacidade

- Não há SQL/API produtiva; logo nenhuma superfície direta de SQL injection/CSRF nesta implementação.
- React escapa conteúdo e não há HTML arbitrário.
- O risco principal é futuro: confiar em `unitId` do browser poderia expor placa, câmera e faturamento de outra unidade. O backend deve derivar/validar escopo pela sessão e capability.
- Exportação futura deve limitar volume, registrar autor/escopo e evitar IDs/campos internos.
- Erros não devem revelar nomes de banco/câmera/configuração; observabilidade precisa correlation id e logs redigidos.

## Acessibilidade e usabilidade

- Tabs e DataTable compartilhadas fornecem base semântica.
- Remover botões sem efeito; implementar foco/Sheet somente quando houver detalhe real.
- Testar navegação de tabs por teclado, scroll horizontal, 320–1024 px, zoom 200%, nomes de tabelas e estados por tab.
- Gráficos futuros precisam alternativa textual/tabela; severidade não pode depender somente de cor.
- Diferenciar sem unidade, vazio, vazio filtrado, parcial, erro e indisponível.

## Matriz arquivo a arquivo

| Arquivo | Papel | Achado / ação recomendada |
| --- | --- | --- |
| `components/index.ts` | Barrel de tabs | Remover nested barrel. |
| `components/reports-tabs-content.tsx` | Três DataTables | Hardcodes e controles sem efeito; separar configuração de tabs/presenters e passar handlers reais ou remover ações. |
| `constants/reports-copy.ts` | Copy parcial | Expandir para tabs, filtros, vazios e erros ou remover junto do preview. Copy `empty` atual não é usada. |
| `docs/README.md` | Documentação | Atualizar para explicitar preview excluído de produção e contrato futuro. |
| `docs/VALIDATION.md` | Checklist | Declara itens sem evidência; substituir por testes/comandos reais. |
| `hooks/use-reports-snapshot.ts` | Estado e unidade | Duplicação, strings hardcoded e race. Reusar controller/generation guard; sem fallback de unidade. |
| `model/reports-mock-data.ts` | Fixtures dev | Manter apenas em factory de teste/preview explicitamente importada; excluir quando backend existir. |
| `model/reports-types.ts` | Read model hipotético | Tipos sem schema/invariantes; alinhar ao contrato autorizado real. `ReportsTabKey` morto. |
| `routes/reports-route.tsx` | Composição | Pequena; título pode terminar com nome vazio. Manter gate dev e estado sem unidade. |
| `services/reports-service.ts` | Mock + yard real | Responsabilidades misturadas e default unit. Substituir por gateway real ou remover preview; não misturar fixture e dado real. |
| `table/index.ts` | Barrel de columns | Remover. |
| `table/reports-billing-columns.tsx` | Colunas faturamento | Ações sempre sem efeito; hardcodes e formatação local. Receber callback obrigatório ou não renderizar ações. |
| `table/reports-occupancy-columns.tsx` | Colunas ocupação | Ações sem efeito, data inválida vira `Invalid Date`, severidade manual. Validar wire e centralizar labels. |
| `table/reports-vehicle-columns.tsx` | Colunas movimento | Deep import operations, `0 min` vira vazio e ações sem efeito. Corrigir quando houver read model real. |

## Arquitetura futura

O endpoint deve retornar páginas separadas ou um contrato agregado versionado por unidade/período, sempre autorizado server-side. `routes` apenas compõe; `hooks` orquestram; `services` executam casos de uso; `gateways` fazem I/O; `schemas` validam wire; `model` contém read models e invariantes; `table` apresenta. Dashboard e Reports podem compartilhar somente o contrato operacional comum, não componentes/wrappers por entidade.

## Testes e aceite

1. Produção não contém rota, chunk, nav nem fixtures enquanto não houver backend.
2. Nenhum botão/texto clicável existe sem efeito observável.
3. Unidade anterior nunca sobrescreve a atual; cancelamento e respostas fora de ordem são testados.
4. Backend restringe unidade/período/capability e minimiza PII; testes RLS multiusuário passam.
5. Páginas/exports têm limites, partialidade e rastreabilidade.
6. Schemas rejeitam datas, dinheiro, percentuais/capacidade e enums inválidos.
7. Teclado, foco, tabs, estados e viewports são validados.
