# Auditoria forense — `src/features/auth`

Data: 2026-08-01
Estado: auditoria concluída; refatoração pendente
Escopo: 33 arquivos da feature, 11 arquivos de teste, configuração e Edge Functions de autenticação/sessão/passkey

## Resumo executivo

A feature possui boas fundações: valida CPF, telefone e senha; usa mensagens genéricas contra enumeração na UI; mantém credenciais somente em memória; separa sessão e autorização; usa RLS/RPC para perfil e lease; impede bypass em build de produção; exige contexto seguro para passkeys; e mantém os fluxos públicos em Edge Functions sem expor `service_role` ao browser.

Há, porém, drift significativo entre contratos atuais e legados. O fluxo nativo `registerAuthenticatedPasskey` cadastra a credencial no Supabase Auth, mas não invoca `auth-register-passkey`; por isso, auditoria e transição de `passkey_reset` para `active` não são garantidas. `auth-complete-passkey` não possui consumidor encontrado e ignora erro ao consumir o flow. A política estática de permissões por papel ainda existe e é testada embora o perfil produtivo falhe fechado e use permissões do banco. Esse código duplicado já divergiu do catálogo ativo em migrations.

## Achados priorizados

| ID | Severidade | Achado | Refatoração exigida |
| --- | --- | --- | --- |
| AT-01 | Alta | Registro de passkey não chama a função que audita e normaliza `passkey_reset`. | Após `registerPasskey`, invocar contrato protegido idempotente, validar resposta e só então atualizar o perfil/mostrar sucesso. |
| AT-02 | Alta | `auth-complete-passkey` está exposta sem consumidor e não verifica o erro do update de `consumed_at`. | Confirmar depreciação; remover função/config/contratos legados ou tornar claim/consume atômico e testar replay. |
| AT-03 | Alta | `auth-password` limita tentativas por conta, mas não apresenta rate limit por origem/IP na função pública. | Adicionar limite redigido por IP e combinação defensiva, sem confiar em header controlável pelo cliente e sem permitir DoS por CPF. |
| AT-04 | Alta | O cadastro de permissões estático por papel é código morto produtivo e pode divergir da matriz real. | Remover fallbacks e helpers sem consumidor; manter o banco/RPC como fonte de verdade e teste de paridade das chaves TypeScript. |
| AT-05 | Média | Respostas externas de Auth/RPC/Functions são parseadas manualmente; registro de passkey aceita payload inválido e devolve ID vazio. | Criar schemas Zod separados por resposta e falhar fechado. |
| AT-06 | Média | Avatar aceita qualquer HTTP(S) ou `data:image/` vindo do perfil. | Aceitar apenas path do bucket ou HTTPS em allowlist explícita; rejeitar HTTP, data URI e hosts desconhecidos. |
| AT-07 | Média | Falha de heartbeat/lease é engolida indefinidamente sem observabilidade ou política de falha. | Registrar falha redigida, aplicar backoff e definir limite para revalidação/saída segura conforme risco. |
| AT-08 | Média | Falha na troca obrigatória limpa sempre credenciais/challenge, inclusive erro transitório. | Limpar segredo imediatamente quando necessário, mas permitir reautenticação/retentativa explícita com estado compreensível. |
| AT-09 | Média | Recuperação limita apenas por hash de IP e pode acumular solicitações repetidas/distribuídas. | Adicionar cooldown/idempotência por correlação segura e testes contra spam sem revelar existência da conta. |
| AT-10 | Média | Teste de senha forte usa o schema errado e passa porque Zod remove campos extras. | Testar `requiredPasswordSchema`; adicionar limites, igualdade com senha atual e casos Unicode/whitespace decididos. |
| AT-11 | Média | Testes de migration inspecionam texto histórico, não o schema efetivo pós-63 migrations. | Substituir confiança textual por contratos executados após `supabase db reset`. |
| AT-12 | Baixa | Raiz exporta uma API muito ampla; existem oito barrels internos e vários tipos históricos sem consumidor. | Manter um índice público estreito e imports diretos internos; remover tipos/aliases mortos. |
| AT-13 | Baixa | Rotas de login/recuperação concentram formulário, máquina de passos, parsing e feedback; copy obrigatória não usa semântica `required` de forma consistente. | Extrair controllers/schemas de apresentação e corrigir `required`/`aria-required`, foco e anúncios. |
| AT-14 | Baixa | Documentação exige barrels em todos os subdiretórios, contrariando o padrão atual de API estreita. | Reescrever README/VALIDATION após a refatoração. |

## Fluxos auditados

### Senha

`AuthLoginRoute -> AuthProvider -> auth-password -> Supabase Auth + auth_flow_attempts -> setSession -> get_current_auth_profile`.

A função pública usa CPF HMAC, mensagem genérica, bloqueio por tentativas, claim de flow, rollback da senha em falha conhecida e revogação de sessões. A operação cruza Auth e Postgres, portanto não é uma transação única; a compensação existente deve permanecer coberta por testes de cada falha.

### Passkey

`supabase.auth.signInWithPasskey()` autentica; `auth-passkey-login` registra auditoria manualmente. O erro dessa chamada é atualmente ignorado. Para cadastro, `supabase.auth.registerPasskey()` é executado, mas `auth-register-passkey` não é chamado. `auth-complete-passkey` pertence a um fluxo anterior e não foi encontrado em consumidores.

### Perfil/sessão

O browser valida o usuário, chama `touch_current_auth_session` e depois `get_current_auth_profile`. O RPC retorna permissões somente para status ativo e a UI descarta chaves desconhecidas. A policy de lease permanece com enforcement remoto desabilitado por rollout compatível; o timeout local de 45 minutos continua relevante, mas revogação explícita é aplicada mesmo com enforcement temporal desligado.

### Recuperação

`auth-recovery-request` valida payload no servidor, usa HMAC para CPF/IP/user-agent, aplica atraso mínimo e resposta genérica, compara contato e cria solicitação. Nome/e-mail/telefone devem permanecer sob RLS e retenção definida. O rate limit deve considerar abuso distribuído e duplicação.

## Segurança

- SQL injection: queries usam SDK/RPC e valores parametrizados; nenhuma concatenação SQL foi encontrada.
- XSS: React escapa conteúdo; o risco mais concreto é carregamento de avatar externo/data URI, não HTML direto.
- CSRF: Functions usam bearer token quando autenticadas; endpoints públicos não dependem de cookie, mas exigem CORS/origin, rate limit e payload estrito.
- Enumeração: mensagens do frontend são genéricas; diferenças HTTP como 423 podem revelar conta bloqueada a clientes diretos e devem ser avaliadas.
- Segredos: senha atual/nova fica em memória e nunca deve entrar em log/auditoria. O ref deve ser limpo em cancelamento, logout, unmount e troca de identidade.
- Autorização: decisões produtivas devem vir de permissions retornadas pelo RPC/RLS; hierarquia de UI não substitui capability do backend.
- Passkeys: RP ID/origin são validados em config; previews não devem compartilhar credenciais do domínio produtivo.

## Performance e resiliência

O provider memoiza o contexto e usa geração para descartar profiles antigos. A inatividade usa dois intervals e listeners passivos globais; o custo é baixo, mas eventos de scroll são frequentes e o heartbeat precisa de backoff/jitter para várias abas. `localStorage` sincroniza atividade sem dados pessoais. Calls devem aceitar cancelamento quando aplicável e evitar tempestade de refresh causada por múltiplos eventos Auth.

## Acessibilidade

O card é centralizado, os formulários usam `Field`, labels, erros e campo de senha com controle Mostrar/Ocultar. Faltam `required`/`aria-required` consistentes, foco automático no primeiro erro/novo passo, anúncio de mudança de etapa, teste de Caps Lock, teclado/foco de passkey e recuperação, e viewport estreito. O botão de passkey deveria refletir suporte/origem em vez de oferecer uma ação sabidamente impossível.

## Matriz por arquivo

| Arquivo | Responsabilidade | Achado/decisão |
| --- | --- | --- |
| `index.ts` | API pública | Excessivamente amplo; reduzir a contratos consumidos externamente. |
| `api/auth-api-error.ts` | Erros públicos | Seguro, porém sem códigos tipados; criar erro de domínio sem expor detalhe. |
| `api/auth-api-helpers.ts` | Parsing/cliente | Parser manual e avatar permissivo; substituir por schemas/allowlist. |
| `api/auth-api.ts` | Barrel de compatibilidade | Comentário admite validador legado; remover compat e barrel. |
| `api/auth-passkey-api.ts` | Login/cadastro passkey | Ignora falha de auditoria e não finaliza cadastro no backend. Corrigir. |
| `api/auth-password-api.ts` | Password Function | Parsing manual; normaliza `register_passkey` legado. Remover legado após migração. |
| `api/auth-profile-api.ts` | Perfil e assinatura Auth | Boa geração indireta no provider; avatar externo e null silencioso exigem política. |
| `api/auth-recovery-api.ts` | Solicitação pública | Pequeno; validar resposta e erro/código tipados. |
| `api/auth-session-api.ts` | Lease/logout | Contrato claro; schema manual e logout parcial precisam testes. |
| `api/index.ts` | Barrel interno | Remover. |
| `authorization/authorization-policy.ts` | Papéis/labels/política | Mistura labels úteis com fallback morto e hierarquia duplicada. Separar e remover duplicação. |
| `authorization/index.ts` | Barrel interno | Remover. |
| `components/auth-page-card.tsx` | Envelope visual | Composição shadcn adequada. Testar zoom/viewport; revisar política do alt do logo. |
| `components/index.ts` | Barrel interno | Remover. |
| `constants/auth-copy.ts` | Copy | Centralizado; completar mensagens tipadas de estados novos. |
| `constants/index.ts` | Barrel interno | Remover. |
| `context/auth-context.tsx` | Contrato/context hooks | Um erro hardcoded; API grande. Centralizar copy e separar comandos se necessário. |
| `context/auth-inactivity-storage.ts` | Sincronização entre abas | Sem PII e responsabilidade clara. Tratar quota/storage indisponível sem quebrar auth. |
| `context/auth-inactivity.ts` | Heartbeat/deadline | Boa lógica de relógio; erro silencioso, sem backoff e sem teste multiaba. |
| `context/auth-provider.tsx` | Orquestração | Arquivo grande, múltiplos fluxos e limpeza agressiva do challenge. Decompor reducer/controllers. |
| `context/create-auth-access-state.ts` | Predicados de capability | Banco segue autoridade; bypass é limitado a DEV pela config. Manter gate explícito e testado. |
| `context/index.ts` | Barrel interno | Remover; hoje reexporta duplicado do provider. |
| `contracts/auth-contracts.ts` | Status, funções, permissões, timeouts | Fallback por papel e funções legadas causam drift. Manter chaves canônicas e paridade DB. |
| `contracts/index.ts` | Barrel interno | Remover. |
| `docs/README.md` | Arquitetura | Afirma normalização externa abrangente e prescreve barrels; atualizar. |
| `docs/VALIDATION.md` | Checklist | Evidência manual/histórica; substituir por gates reais e schema efetivo. |
| `hooks/index.ts` | Alias de context hooks | Diretório sem responsabilidade própria. Remover diretório/barrel. |
| `routes/auth-login-route.tsx` | Login e troca obrigatória | Grande; semântica required/foco e máquina de estados merecem extração. |
| `routes/auth-recovery-route.tsx` | Recuperação | Limpar erro ao editar, validar value sem cast e testar privacidade/teclado. |
| `types/auth-types.ts` | Tipos de domínio/wire | Mistura tipos atuais e seis contratos históricos sem consumidor. Separar e remover mortos. |
| `types/index.ts` | Barrel interno | Remover. |
| `validation/auth-validation.ts` | Schemas/máscaras | Base correta; decidir whitespace/Unicode/senha atual e reutilizar server-side. |
| `validation/index.ts` | Barrel interno | Remover. |

## Testes vistoriados

| Arquivo | Avaliação |
| --- | --- |
| `auth-api.test.ts` | Cobre compat legada e login passkey; falta falha da Function e cadastro/finalização. |
| `auth-contracts.test.ts` | Confirma fail-closed de permissions; adicionar paridade com catálogo final. |
| `auth-login-route.test.tsx` | Cobre expiração, mostrar senha e troca obrigatória; falta erros/foco/teclado/redirect adversarial. |
| `auth-provider-inactivity.test.tsx` | Só um caso; ampliar multiaba, RPC falho, revogação e cleanup. |
| `auth-recovery-route.test.tsx` | Só caminho feliz; faltam schema, erro, duplicate submit, teclado e não enumeração. |
| `auth-session-api.test.ts` | Caminhos felizes; faltam statuses, payload inválido e falha parcial de logout. |
| `auth-session-config.test.ts` | Paridade local útil, não comprova remoto. |
| `auth-session-deadline.test.ts` | Cobre dois casos; ampliar relógio inválido/expirado. |
| `auth-session-migration.test.ts` | Testa texto de uma migration histórica, não estado final. Migrar para contrato DB. |
| `auth-validation.test.ts` | O teste de nova senha usa `authLoginSchema` e é falso-positivo. Corrigir imediatamente. |
| `authorization-policy.test.ts` | Grande parte perpetua fallback morto por papel. Remover junto com o legado; testar regras realmente consumidas. |

## Critérios de aceite

- Cadastro de passkey é finalizado/auditado de modo idempotente e `passkey_reset` não permanece indevidamente.
- Função legada sem consumidor é removida ou possui claim atômico e teste de replay.
- Login e recuperação têm rate limiting comprovado sem enumeração/DoS por identificador.
- Todo payload externo relevante passa por schema Zod.
- Nenhuma permission é inferida por papel no cliente; chaves frontend e catálogo DB têm paridade automatizada.
- Avatar rejeita origem/URI não aprovada.
- Testes de senha realmente exercitam o schema certo.
- RLS/RPC/session tests rodam contra banco resetado; passkeys validam RP ID/origins.
- Teclado, foco, leitor de tela, mobile e console do navegador passam.
