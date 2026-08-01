# Revisão forense — `src/features/operations`

Data da revisão: 2026-08-01
Escopo: o único arquivo da feature, seus quatro consumidores em Dashboard/Reports e a documentação arquitetural relacionada.
Estado: auditoria concluída; decisão de remoção/migração pendente da etapa consolidada.

## Parecer executivo

O diretório não constitui uma feature: contém apenas três unions, três mapas de labels e três formatadores puros. Todos os consumidores pertencem aos previews de desenvolvimento `dashboard` e `reports`; não há rota, gateway, schema, caso de uso, teste ou README. O arquivo é limpo e de custo constante, mas cria uma fronteira arquitetural artificial e deep imports entre features.

A decisão recomendada é tratar esses tipos como parte do futuro read model operacional real. Enquanto Dashboard/Reports forem apenas previews, mover tipos/labels para o model comum dos previews (fora de uma falsa feature produtiva) ou duplicar somente os contratos que forem deliberadamente independentes. Quando existir backend operacional, criar `operations` com contrato real, schemas e gateway; não preservar uma feature somente para três labels.

## Avaliação

- **Estrutura e responsabilidade:** pequena e coesa internamente, porém o diretório promete uma capacidade inexistente.
- **Nomenclatura:** nomes são claros; valores snake_case representam um contrato hipotético, não um wire validado.
- **Hardcodes:** labels centralizados adequadamente; não há copy disperso neste arquivo.
- **Segurança:** não realiza I/O nem renderiza HTML; não há superfície direta de SQL injection, XSS, CSRF, PII ou autorização.
- **Performance:** consultas `Record` são O(1); impacto desprezível.
- **Compatibilidade:** parâmetros estritos em compile-time, mas valores vindos de backend ainda precisariam schema runtime e fallback explícito.
- **Acessibilidade:** labels textuais ajudam a não depender apenas de cor; a acessibilidade final pertence aos consumidores.
- **Erros:** valor fora do union em runtime retorna `undefined`; um schema/`assertNever` será necessário quando houver fonte externa.
- **Testes/documentação:** não há teste direto. `docs/architecture/operations-read-model.md` registra corretamente que o arquivo é temporário.

## Matriz arquivo a arquivo

| Arquivo | Papel | Achado / ação recomendada |
| --- | --- | --- |
| `model/parking-movement-formatters.ts` | Tipos e labels de câmera, movimento e severidade | Vistoriado. Código puro e legível, porém associado apenas a mocks dev. Migrar junto do read model de preview ou substituir pelo contrato operacional real; não manter deep imports `dashboard/reports -> operations` sem API pública e ownership real. Adicionar validação runtime/testes somente quando o contrato deixar de ser fixture. |

## Critérios de aceite

1. Nenhuma feature produtiva depende de domínio fictício.
2. Dashboard e Reports compartilham contrato somente se forem projeções do mesmo backend autorizado.
3. Valores externos são validados e valores desconhecidos têm estado explícito, nunca `undefined` silencioso.
4. O diretório `operations` existe apenas quando tiver responsabilidade, API pública estreita, documentação e testes próprios.
