# Segurança

Feature responsável pelo painel de segurança da conta autenticada.

## Levantamento forense

- O perfil autenticado vem de `get_current_auth_profile` e já expõe status de passkey, permissões, e-mail e telefone mascarado.
- A política de senha forte é obrigatória nos fluxos de criação e troca: 12+ caracteres com maiúscula, minúscula, número e símbolo.
- A troca de senha usa a Edge Function `profile-change-password`, que valida a senha atual, atualiza a senha, revoga sessões globalmente e registra auditoria.
- Eventos recentes usam uma RPC user-scoped sobre `audit_events`, com allowlist fixa e sem expor ator, alvo, motivo ou metadata.
- TOTP usa `mfa.enroll` e `mfa.challengeAndVerify` do Supabase Auth em três fases; SMS é exibido apenas como capacidade futura.
- Sessões, revisão de logins e confiança da sessão atual vêm de RPCs `security definer` user-scoped; confiança exige AAL2.

## Estrutura

- `constants/`: textos e labels.
- `types/`: contratos da feature.
- `model/`: derivação do score de seis medidas e eventos recentes.
- `schemas/`: validação estrita da postura retornada pelo banco.
- `services/`: sessão, postura, MFA e troca de senha.
- `hooks/`: composição de estado e fluxo compartilhado de troca de senha.
- `components/`: blocos de UI da feature.
- `routes/`: entrypoint da rota.

## Controles suportados

- Autenticação de dois fatores: escolha do método, QR/chave copiável e verificação TOTP real com schema Zod.
- Senha forte: política obrigatória e troca protegida sem alterar whitespace do segredo.
- Chave de acesso: cadastro WebAuthn finalizado pela Edge Function antes do sucesso.
- Recuperação: exige e-mail e telefone presentes no perfil.
- Logins recentes: lista sessões ativas dos últimos 30 dias e persiste a revisão.
- Dispositivos confiáveis: confia a sessão atual somente depois de autenticação AAL2.
- Eventos recentes: mostra 2 registros da auditoria e expande localmente até o limite de 5.

## Fora do escopo atual

- Geolocalização derivada de IP.
- Confiança persistente além da duração da sessão autenticada.
- Revogação self-service de sessões.
- Exposição de CPF completo, tokens, metadata bruta ou detalhes técnicos de erro.
