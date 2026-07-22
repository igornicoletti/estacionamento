# Validação de entrega — src/features/auth

## Checklist aplicado

- A raiz do diretório contém somente `index.ts`.
- Todos os subdiretórios exportam por barrel `index.ts`.
- O provider foi quebrado em arquivos menores e com responsabilidade única.
- A política de autorização permanece centralizada e reutilizável.
- A camada `api` normaliza payloads externos e isola Supabase da UI.
- Login mantém CPF com máscara, senha visível no fluxo e recuperação acima/alinhada como ação de label.
- Recuperação mantém CPF e telefone mascarados, motivo sem valor inicial e descrição condicional apenas para `other`.
- Não há marcadores de pendência conhecidos nos arquivos entregues.

## Comandos recomendados após aplicar no projeto

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Observação operacional

A validação local do artefato confirma estrutura, sintaxe TypeScript e integridade do ZIP. A validação final de navegador deve ser executada no projeto real, com o Supabase configurado e as Edge Functions disponíveis.

## Sessão e inatividade

- O frontend usa `AUTH_SESSION_TIMEOUTS.inactivityMinutes = 15`, derivando `AUTH_INACTIVITY.timeoutMs`.
- O `supabase/config.toml` local declara `jwt_expiry = 3600`, `timebox = "24h"` e `inactivity_timeout = "15m"`.
- `tests/features/auth/auth-session-config.test.ts` valida que o contrato do frontend continua alinhado ao TOML local.
- Em 22/07/2026, `supabase config push` informou que o remoto estava com `timebox = "0s"` e `inactivity_timeout = "0s"` e recusou aplicar `24h/15m` com status 402 porque timeouts de sessão exigem plano Pro. No remoto atual, a expiração por inatividade é responsabilidade do frontend.
