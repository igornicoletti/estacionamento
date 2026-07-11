# `src/features/auth/hooks`

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `index.ts` | Superfície de compatibilidade para imports existentes de `useAuth` e `useAuthSession`. Não contém lógica própria; a lógica fica em `auth-provider.tsx`. |

## Referências auditadas

- React Context: a lógica de sessão deve ficar no provider, e hooks de consumo devem apenas ler o contexto. Motivo: evitar duplicação de estado e guards paralelos.
  - https://react.dev/reference/react/createContext
