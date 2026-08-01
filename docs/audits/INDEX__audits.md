# Índice de auditorias

Data de atualização: 2026-08-01

## Auditoria vigente

1. `docs/audits/2026-08-01-permissions-feature-forensic-review.md`
   - Revisão individual dos 22 arquivos de `permissions`, fluxo real de autorização, schema local, divergências do catálogo e plano de migração para o padrão vigente.
2. `docs/audits/2026-08-01-users-audit-forensic-review.md`
   - Revisão por arquivo, comparação arquitetural, correções e evidências reais de `users` e `audit`.
3. `src/features/users/README.md`
   - Matriz individual e contrato normativo dos 26 arquivos da feature de usuários.
4. `src/features/audit/README.md`
   - Matriz individual e contrato normativo dos 20 arquivos da feature de auditoria.
5. `docs/audits/2026-07-31-forensic-project-audit.md`
   - Achados, decisões, ondas de modernização e validações executadas.
6. `docs/audits/2026-07-31-forensic-file-inventory.csv`
   - Matriz tabular por arquivo para revisão humana e automação.
7. `docs/audits/2026-07-31-forensic-file-inventory.json`
   - Versão estruturada do mesmo inventário.

## Regra de manutenção

Os inventários são gerados por `scripts/generate-forensic-inventory.mjs` e devem ser regenerados depois de ondas estruturais. Eles não devem ser editados manualmente.
