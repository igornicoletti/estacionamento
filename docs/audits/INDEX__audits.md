# Índice de auditorias

Data de atualização: 2026-07-31

## Auditoria vigente

1. `docs/audits/2026-07-31-forensic-project-audit.md`
   - Achados, decisões, ondas de modernização e validações executadas.
2. `docs/audits/2026-07-31-forensic-file-inventory.csv`
   - Matriz tabular por arquivo para revisão humana e automação.
3. `docs/audits/2026-07-31-forensic-file-inventory.json`
   - Versão estruturada do mesmo inventário.

## Regra de manutenção

Os inventários são gerados por `scripts/generate-forensic-inventory.mjs` e devem ser regenerados depois de ondas estruturais. Eles não devem ser editados manualmente.
