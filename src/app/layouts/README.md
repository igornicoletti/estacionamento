# `src/app/layouts`

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `authenticated-layout.tsx` | Layout da aplicação autenticada. Monta sidebar/header/outlet e renderiza o alerta de inatividade usando estado do `AuthProvider`. |

## Referências auditadas

- shadcn/ui Sidebar: composição com provider, sidebar e área de conteúdo principal. Motivo: manter estrutura de layout, não mover regra de auth para dentro de sidebar.
  - https://ui.shadcn.com/docs/components/sidebar
- shadcn/ui Alert Dialog: inatividade é confirmação de sessão e deve ser exibida como interrupção importante, usando `AppAlertDialog` diretamente no layout.
  - https://ui.shadcn.com/docs/components/alert-dialog
