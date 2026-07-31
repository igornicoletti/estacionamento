# Instruções de engenharia

Aplicação Vite 8, React 19, TypeScript 6, React Router 8, Tailwind 4, shadcn/ui e Supabase. Use pnpm na versão declarada em `package.json`. Textos e documentação do produto são escritos em português.

## Contratos obrigatórios

- Preserve mudanças locais e não faça reset, staging global, commit, push ou alteração remota sem autorização explícita.
- `src/components/ui` é a camada gerada do shadcn. Não personalize internals; componha extensões em `src/components/shared` ou na feature consumidora.
- Pesquise componentes existentes antes de criar novos: `npx shadcn@latest search`, `info` e `docs`. Registries externos exigem revisão e allowlist.
- A `DataTable` é genérica e não pode importar features, rotas, fixtures ou contratos de domínio.
- Produção usa gateways Supabase/Edge reais. Gateways em memória e fixtures ficam sob `tests/` e são injetados explicitamente.
- Erro remoto nunca pode produzir mensagem de sucesso nem fallback sintético.
- Imports entre features usam o contrato público estreito da feature. Rotas lazy podem ser importadas diretamente pelo router.
- Tipos de wire, formulário e domínio são distintos. Valide payloads externos com Zod antes de normalizá-los.
- CPF completo não pode ir para URL, JWT, logs, auditoria ou estado persistente do frontend.

## Estrutura de feature

Use somente as pastas necessárias: `routes`, `components`, `hooks`, `services`, `gateways`, `schemas`, `model`, `table` e `constants`. Evite `utils` genérico e nested barrels. A rota compõe UI; regras ficam em services/model; I/O fica em gateways.

## UI e acessibilidade

- Use tokens semânticos; `className` serve para layout, espaçamento e responsividade.
- Prefira `gap-*`, `size-*`, `truncate` e `cn()` para classes condicionais.
- Passe ícones como componentes tipados e aplique `data-icon`; não infira ícones por strings.
- Formulários usam `FieldGroup`/`Field`, `FieldSet`, `aria-invalid` e `data-invalid`.
- Itens de menu/select ficam nos grupos correspondentes. Dialog, Sheet e Drawer têm título acessível.
- Use `Separator`, `Empty`, `Alert`, `Skeleton`, `Badge` e `Spinner` em vez de equivalentes manuais.

## Supabase

- Não reescreva migrations publicadas; correções são migrations aditivas.
- Diferencie endpoints de usuário (`verify_jwt=true`) de integrações service-to-service com segredo próprio (`verify_jwt=false`).
- Confirme RLS, grants, `security_invoker`, `security definer`, autorização, rate limit e idempotência no estado final do banco.
- Variáveis públicas ficam em `.env.example`; segredos e integração ERP em `supabase/functions/.env.example`.
- O domínio WebAuthn produtivo é `estacionamento.redemontecarlo.com.br`; previews não compartilham credenciais produtivas.

## Gates

Execute, conforme o risco: `pnpm validate`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:test`, `pnpm test`, `pnpm build`, `deno check` para todas as Edge Functions, `pnpm audit --prod --audit-level high` e `git diff --check`. Teste inconclusivo por timeout não conta como aprovação.
