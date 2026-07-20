# Validação de Fluxo — Unidades (Pátio, Funcionários e Sync)

## Fluxo

Configuração de pátio por unidade, atualização de vagas/ativo e sincronização operacional.

## Objetivo

Eliminar atualização tardia na coluna de vagas e validar robustez de sync.

## Evidências executadas

- Correção aplicada em `src/features/units/hooks/use-unit-yard-configs.ts` com atualização otimista imediata.
- Testes validados: `tests/features/units/unit-yard-service.test.ts`, `tests/features/units/units-route.test.tsx`, `tests/features/units/unit-sync-service.test.ts`.

## Resultado

- Bug de atualização tardia de vagas corrigido no frontend.
- Fluxo de sync mantém tratamento de in-progress e refresh de snapshots.

## Falhas encontradas

- Não foi possível validar chamadas ERP reais por ausência de certificado/integração ativa.

## Riscos e vulnerabilidades

- Em ambiente real, timeout/volume podem pressionar lock TTL e janela de cron.

## Melhorias recomendadas

1. Ajustar lock TTL por métricas de produção/homolog.
2. Implementar checkpoint de sync para retomada parcial em falha longa.

## Status final

Aprovado localmente; pronto para homologação com ERP real.
