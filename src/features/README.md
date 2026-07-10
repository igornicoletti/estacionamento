# src/features

Referência rápida das features impactadas nesta entrega.

## Diretórios

| Diretório | Responsabilidade |
|---|---|
| `auth/` | Estado e fluxos de autenticação, sessão, recuperação e troca obrigatória de senha. |

## Fontes auditadas

- Supabase Auth/Functions/RLS: chamadas de auth ficam isoladas em uma fronteira de API e permissões efetivas vêm de RPC.
- OWASP Authorization: negar por padrão e evitar matriz local de roles no frontend.
