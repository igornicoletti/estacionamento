# My Profile

Feature responsavel pela pagina de dados pessoais da conta autenticada.

## Levantamento forense

- O estado inicial vem de `useAuth()` e e normalizado por `mapAuthProfileToProfileSummary`.
- A rota suporta editar nome, e-mail e telefone via Edge Function `profile-update`.
- A foto usa upload para o bucket `avatars` quando Supabase esta configurado; em dev sem Supabase, o arquivo e convertido para `data:image` apenas para preview local.
- A Edge Function `profile-update` rejeita URL externa e `data:image` no ambiente remoto, entao a UI nao oferece aba de URL.
- CPF, perfil, unidade e status sao dados protegidos exibidos em leitura, sem edicao self-service nesta rota.
- A troca de senha reutiliza `SecurityChangePasswordDialog` e `changeCurrentPassword`, evitando um segundo fluxo paralelo.

## Estrutura

- `components/`: cartoes de perfil e dialog compartilhado de foto.
- `hooks/`: composicao do perfil autenticado com acoes de persistencia.
- `routes/`: entrypoint da rota e redirect legado.
- `services/`: Edge Function de perfil, upload de avatar e validacoes de arquivo.
- `types/`: contratos de snapshot e payload.
- `utils/`: normalizacao e formatacao defensiva dos dados do perfil.

## Controles suportados

- Atualizar nome, e-mail e telefone.
- Enviar foto JPG, PNG ou WebP ate 5 MB.
- Alterar senha pelo fluxo compartilhado de Security.
- Revisar CPF mascarado/display, perfil, unidade e status.

## Fora do escopo atual

- URL externa de avatar.
- Edicao de CPF, papel, unidade ou status pelo proprio usuario.
- Remocao de avatar sem envio de nova imagem.
- MFA/TOTP, trusted devices, historico de logins ou revogacao de sessoes.
