# Shared components

Componentes reutilizáveis de composição da aplicação.

## Decisões

- O diretório mantém apenas um `index.ts` público no nível raiz.
- Componentes específicos não criam subpastas nem barrels próprios.
- `AppSheet` encapsula o shell visual do Sheet.
- `AppDetailsSheet` encapsula o padrão de detalhes de registro usado por `users`, `permissions` e `notifications`.
- Estados vazios devem usar `AppEmptyState`.
