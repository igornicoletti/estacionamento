# Backlog — Validação de Alto Impacto Pré-Produção

Data de registro: 2026-07-20

## Registro do adiamento solicitado

A validação de alto impacto pré-produção com ERP real foi explicitamente adiada para etapa futura.

## Escopo adiado (não esquecer)

1. Teste de carga com massa próxima do real (clientes ativos + veículos) em ambiente homolog.
2. Medição de throughput de sincronizações (`units-sync` e `clients-sync`) por janela.
3. Ajuste fino de cron incremental/full com base em tempo real de execução.
4. Validação de consistência ponta a ponta entre:
   - tabelas operacionais;
   - histórico de sync (`*_sync_runs`);
   - auditoria;
   - notificações.
5. Simulação de falhas controladas no ERP (timeout, erro auth, payload inconsistente).

## Critérios de saída para este backlog

- Evidência por relatório em `docs/reports/`.
- Métricas objetivas (P50/P95 de execução, falhas por janela, backlog de runs).
- Plano de rollback e reprocessamento documentado.
