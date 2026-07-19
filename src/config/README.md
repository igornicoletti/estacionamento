# config

Configuracao publica de ambiente e helpers de runtime do frontend.

## Arquivos

- `env.ts`: leitura, validacao e normalizacao das variaveis publicas `VITE_*`.
- `index.ts`: superficie publica do diretorio.

## Decisoes

- O diretorio deve ser mantido.
- A validacao de ambiente concentra regras de seguranca e coerencia de origin, Supabase e WebAuthn.
- `shouldBypassAuthInDev` continua centralizado aqui para evitar checks dispersos pelo projeto.

## Auditoria forense

- Nao foram encontrados arquivos mortos no diretorio.
- A maior parte do acoplamento existe por necessidade arquitetural: auth bypass, bootstrap Supabase e validacao de ambiente.
- O risco atual nao esta na estrutura do diretorio, mas no uso indevido de bypass em features. O helper centralizado reduz esse risco.
