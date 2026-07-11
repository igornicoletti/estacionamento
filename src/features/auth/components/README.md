# `src/features/auth/components`

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `auth-page-card.tsx` | Wrapper visual das páginas públicas de autenticação. Não contém lógica de login, recuperação, senha ou passkey. |
| `index.ts` | Exporta somente componentes visuais de auth aprovados. |

## Referências auditadas

- shadcn/ui Card: usado para estruturar título, descrição e conteúdo das telas públicas de auth. Motivo: manter composição visual consistente sem criar wrappers de campos simples.
  - https://ui.shadcn.com/docs/components/card
