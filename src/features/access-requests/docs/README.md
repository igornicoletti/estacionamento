# Solicitações de acesso

## Objetivo

Feature responsável por listar solicitações pendentes de recuperação de acesso, exibir detalhes sensíveis autorizados e permitir aprovação ou negação com confirmação explícita.

## Estrutura

```text
src/features/access-requests/
├── components/
├── constants/
├── docs/
├── hooks/
├── model/
├── routes/
├── services/
├── table/
└── index.ts
```

## Decisões aplicadas

- `constants` centraliza textos, labels e chaves de persistência.
- `model` concentra contratos, normalização, sanitização de payload externo e montagem dos detalhes.
- `services` isola Supabase e Edge Function `admin-recovery-review`.
- `hooks` encapsula snapshot assíncrono, recarga e fluxo de revisão.
- `table` contém colunas e ações da tabela de recuperação.
- `routes` compõe página, tabela, detalhes e confirmações.
- A raiz mantém apenas `index.ts`.

## Segurança

- Dados vindos do banco são tratados como `unknown` até a normalização.
- Telefone usa o valor visível autorizado, com fallback seguro para ausência de dado.
- Aprovação exige senha temporária validada pelo schema de senha novo do módulo `auth`.
- Negação usa alerta destrutivo com confirmação explícita.
- A escrita administrativa passa pela Edge Function `admin-recovery-review`.
