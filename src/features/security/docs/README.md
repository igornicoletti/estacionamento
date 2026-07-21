# Security

Feature responsável pelo painel de segurança da conta autenticada.

## Levantamento forense

- O perfil autenticado vem de `get_current_auth_profile` e já expõe status de passkey, permissões, e-mail e telefone mascarado.
- A política de senha forte é obrigatória no Supabase e nos schemas locais: 12+ caracteres com maiúscula, minúscula, número e símbolo.
- A troca de senha usa a Edge Function `profile-change-password`, que valida a senha atual, atualiza a senha, revoga sessões globalmente e registra auditoria.
- Eventos recentes da página usam notificações `type = "security"` entregues ao próprio usuário por RLS.
- A rota não possui fonte suportada para lista real de dispositivos, localização de acessos, MFA/TOTP ou trusted devices.

## Estrutura

- `constants/`: textos e labels.
- `types/`: contratos da feature.
- `model/`: derivação de score, medidas suportadas e eventos recentes.
- `services/`: integração com sessão e troca de senha.
- `hooks/`: composição de estado e fluxo compartilhado de troca de senha.
- `components/`: blocos de UI da feature.
- `routes/`: entrypoint da rota.

## Controles suportados

- Senha forte: exibida como medida concluída por política obrigatória do sistema.
- Passkey: permite cadastrar ou gerar nova passkey via WebAuthn/Supabase Auth.
- Contato de recuperação: considera telefone mascarado como sinal mínimo suportado.
- Sessão atual: exibe navegador, sistema operacional, IP quando disponível e última autenticação.
- Permissões efetivas: exibe wildcard ou lista de permissões recebidas pelo perfil.
- Eventos recentes: lista até 4 notificações de segurança.

## Fora do escopo atual

- MFA/TOTP.
- Trusted devices.
- Histórico completo de logins ou geolocalização.
- Revogação self-service de sessões.
- Exposição de CPF completo, tokens, metadata bruta ou detalhes técnicos de erro.
