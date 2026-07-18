# src/features/auth

Feature de autenticação, sessão, recuperação de acesso, passkey, autorização derivada e controle de inatividade.

## Estrutura

- `api/`: fronteira com Supabase Auth, RPC e Edge Functions.
- `authorization/`: política de papéis, permissões, hierarquia e escopo.
- `components/`: composição visual específica de autenticação.
- `context/`: provider, contexto, sessão, permissões efetivas e inatividade.
- `contracts/`: constantes, enums de domínio, permissões, status e normalizadores.
- `copy/`: textos centralizados da feature.
- `routes/`: páginas públicas de login e recuperação de acesso.
- `types/`: contratos TypeScript compartilhados da feature.
- `validation/`: schemas Zod, máscaras e helpers de erro de formulário.
- `index.ts`: barrel público da feature.

## Decisões arquiteturais

- A raiz mantém somente `index.ts`; documentação vive em `docs`.
- O provider foi dividido em contexto, inatividade, armazenamento de expiração e estado de acesso.
- A autorização permanece separada da autenticação: sessão identifica o usuário; autorização decide permissões.
- Payloads externos são normalizados na borda da API antes de chegar à UI.
- CPF e telefone são normalizados e mascarados na camada de validação/formulário.
- Campos obrigatórios usam asterisco visual e validação explícita.
- Recuperação de acesso mantém o motivo inicialmente sem seleção e só exibe detalhes quando o motivo é `other`.

## Referências

- React: composição, Context e hooks.
- TypeScript: contratos explícitos e `strict`.
- Supabase: sessão, Auth, RPC e Edge Functions no cliente browser.
- OWASP Authentication, Session Management e Authorization Cheat Sheets.
- Zod: validação declarativa em fronteiras de formulário.
