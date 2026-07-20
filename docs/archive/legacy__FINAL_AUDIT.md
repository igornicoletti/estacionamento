# Auditoria Final

Data da revisão: 2026-07-13

## Parecer

As correções auditadas foram aplicadas em código, Supabase, testes, validação e documentação. O projeto agora compila com rotas carregadas por lazy import efetivo, providers obrigatórios registrados, permissões estritas, funções Supabase compartilhadas, configuração de Auth endurecida e escritas comerciais transacionais.

## Correções Implementadas

- `AppProviders` inclui `NotificationsProvider`.
- Barrels de auth e notificações não exportam mais rotas lazy.
- Contrato de permissões usa união fechada de `AUTH_PERMISSION`.
- Perfil autenticado não cai para fallback de papel quando recebe permissões explícitas inválidas.
- Logout usa escopo local e limpa cache assíncrono.
- Senha exigida em desafio de autenticação não fica em React state.
- `useAsyncSnapshot` descarta respostas obsoletas e expõe limpeza de cache.
- Notificações têm reducer exaustivo e atualização por item/batch sem relistar dados de forma frágil.
- Serviços de usuários falham fora de testes quando o backend administrativo não está configurado.
- Rotas de preços e regras usam permissões `prices.manage` e `rules.manage`.
- Salvamento de preços e regras VIP passa por RPCs Supabase versionadas e auditadas.
- RLS comercial usa permissões do banco em vez de papel hardcoded.
- Sobreposição de preços ativos por escopo é bloqueada por constraint.
- Edge Functions compartilham CORS, HMAC e cliente admin tipado.
- CI valida aplicação, testes e funções Deno.
- Documentos principais foram atualizados para a arquitetura atual.

## Contratos Antirregressão

- Não exportar rotas lazy por barrels importados estaticamente.
- Não conceder permissão por fallback quando o backend retornou lista explícita inválida.
- Não salvar preço ou regra comercial crítica fora de RPC transacional.
- Não depender de `localStorage` como autoridade de produção para regra comercial.
- Não manter senha atual em estado React após desafio de autenticação.
- Não ignorar erros de perfil autenticado, fatores MFA ou funções administrativas.
- Não publicar Edge Function sem `deno check`.

## Validação Esperada

```bash
pnpm validate
pnpm lint
pnpm typecheck
pnpm typecheck:test
pnpm test
pnpm build
```

Além disso, todas as funções em `supabase/functions/*/index.ts` devem passar em `deno check`.
