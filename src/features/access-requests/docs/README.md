# Solicitações de acesso

## Objetivo

Feature responsável por listar solicitações pendentes de recuperação de acesso, exibir detalhes sensíveis autorizados e permitir aprovação ou negação com confirmação explícita.

## Estrutura

```text
src/features/access-requests/
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
- `table` contém colunas, filtros e ações da tabela de recuperação.
- `routes` compõe página, tabela, detalhes e confirmações.
- A raiz mantém apenas `index.ts`.

## Levantamento forense

- `access_recovery_requests` não expõe CPF bruto nem nome do solicitante; a UI identifica a linha com e-mail quando disponível e, em seguida, telefone autorizado.
- `cpf_hmac` existe apenas para correlação segura no backend e não deve ser exibido.
- `phone` é obrigatório no formulário público e na Edge Function, mas linhas legadas podem conter `phone_display` inválido; o normalizador rejeita texto que não pareça telefone.
- `description` permanece coluna técnica do banco para o caso `other`, mas não é coluna da tabela. Quando o motivo é "Outro motivo", o texto informado vira o motivo exibido.
- Magic link por e-mail depende de contrato de Auth, template e redirect; não é habilitado nesta refatoração por não existir fluxo suportado nesta rota.

## Segurança

- Dados vindos do banco são tratados como `unknown` até a normalização.
- Telefone usa apenas valor visível autorizado com formato de telefone válido, ou máscara já existente com dígitos suficientes.
- Aprovação exige senha temporária validada pelo schema de senha novo do módulo `auth`.
- Negação usa alerta destrutivo com confirmação explícita e sem conteúdo contextual extra dentro do alerta.
- A escrita administrativa passa pela Edge Function `admin-recovery-review`.
