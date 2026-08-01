# Auditoria forense — `src/features/captures`

Data: 2026-08-01
Estado: auditoria concluída
Escopo: diretório físico vazio

## Resultado

Não existem arquivos, código, testes, README, barrel, rota, import, schema, gateway ou integração Supabase em `src/features/captures`. Diretórios vazios não são rastreados pelo Git; portanto, o diretório não constitui uma feature do artefato versionado e não oferece funcionalidade ao sistema.

## Avaliação dos critérios

| Critério | Resultado |
| --- | --- |
| Estrutura e responsabilidades | Não aplicável; não há módulo. |
| Nomenclatura/código limpo | Não aplicável. |
| Textos hardcoded | Nenhum. |
| Testes/documentação | Ausentes porque não há capability. |
| Segurança, sanitização, acesso e auditoria | Não existe superfície executável. |
| Performance/compatibilidade | Sem impacto em runtime ou bundle. |
| Acessibilidade/usabilidade | Não existe UI. |
| Dependências | Nenhuma. |

## Achado

| ID | Severidade | Achado | Ação |
| --- | --- | --- | --- |
| CP-01 | Baixa | Diretório vazio sugere capability planejada/abandonada e polui a navegação local da árvore. | Remover o diretório físico. Não criar placeholder, barrel ou README dentro dele apenas para mantê-lo no Git. |

## Critério para eventual recriação

Uma futura feature de capturas deve ser criada somente quando houver requisito aprovado e, no mínimo: ator/capability, fonte de dados real, política de retenção/PII, schema externo, gateway, modelo de domínio, rota, estados acessíveis, auditoria e testes RLS/integrados. Até lá, `captures` permanece explicitamente fora do produto.
