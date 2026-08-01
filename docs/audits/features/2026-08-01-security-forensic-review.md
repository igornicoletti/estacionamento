# Revisão forense — `src/features/security`

Data da revisão: 2026-08-01
Escopo: 14 arquivos, teste direto, Auth/Notifications e Edge Function `profile-change-password`.
Estado: auditoria concluída; implementação depende das correções de Auth/Notifications.

## Parecer executivo

A feature foi corretamente reduzida às capacidades existentes: senha, passkey, contato, sessão, permissões e notificações de segurança; MFA/TOTP, trusted devices e histórico inexistentes não são anunciados. A troca de senha revalida a senha atual no backend, usa senha forte, revoga sessões e solicita logout local. Passkey e eventos usam fluxos reais.

O painel ainda apresenta inferências como fatos: “senha forte” é sempre concluída sem evidência sobre a credencial atual; qualquer telefone mascarado é tratado como contato de recuperação concluído sem verificar confirmação; `last_sign_in_at` é rotulado como autenticação da sessão atual; IP é lido de `app_metadata`, embora não exista garantia de que esse campo represente o request atual. Consequentemente, a pontuação pode ser 100 apesar de controles não comprovados.

Além disso, a ação de passkey herda a falha já encontrada em Auth: o registro nativo não conclui o fluxo backend/auditoria/reset no caminho atual. A Edge Function de senha possui estados parciais entre Auth, revogação e auditoria; auditoria falha sem rollback. Esses pontos precisam ser resolvidos na origem, não mascarados na página.

## Achados priorizados

### Alta

1. **Score não baseado em evidência:** `strong-password` é sempre `completed`. Política de novas senhas não prova que credenciais históricas atendem à política. Modelar `unknown`, remover do score ou fornecer evidência server-side segura.
2. **Contato não verificado:** presença de `phoneMasked` equivale a recuperação concluída. Usar flags reais de verificação/capacidade ou nomear como “telefone cadastrado”, não controle concluído.
3. **Passkey incompleta:** a ação depende de `registerProfilePasskey`, cujo fluxo auditado não chama o endpoint de finalização/auditoria e pode manter `passkey_reset`. Corrigir Auth e atualizar perfil antes de confirmar sucesso.
4. **Atomicidade de senha:** backend atualiza senha, depois revoga sessões e escreve audit. Falha após update pode retornar erro embora senha já tenha mudado; audit failure é engolida. Projetar idempotência, estado final verificável e telemetria de compensação.

### Média

5. `SecuritySummaryCard` tem ~16 kB e reúne score, medidas, eventos, sessão, permissões e dialog. Separar componentes/presenters pequenos sem wrappers cosméticos.
6. `getSession()` lê token local, não uma fonte server-side de “sessão atual”; `last_sign_in_at` pode ser a última autenticação global e IP em app metadata pode ser ausente/stale. Ajustar labels ou criar endpoint de sessão autorizado.
7. Erros de `getSession` são ignorados e viram fallback sem estado parcial/indisponível.
8. A rota mostra sempre mensagem de erro de passkey no Alert para qualquer `auth.error`, gerando diagnóstico incorreto.
9. Senhas são submetidas com `.trim()`. Espaços podem ser caracteres legítimos; validação e envio devem preservar exatamente o segredo digitado.
10. Service aceita mensagem retornada pela função em `SecurityServiceError`; UI hoje a substitui pelo toast genérico, mas contrato deve separar mensagem pública/código/cause sem risco de detalhes internos.
11. Tipos de Security dependem do barrel amplo de Auth; Notifications também é dependência direta. Manter APIs públicas estreitas para evitar ciclos/acoplamento.
12. Sem schema runtime para resumo da sessão; parsing manual é permissivo.

### Baixa

13. Ring usa `aria-label` em `div` sem papel/valores de progress; usar `role=progressbar` ou texto semântico equivalente.
14. Ícones não aplicam `data-icon` consistentemente; o fallback de nome de passkey está hardcoded.
15. `default export` da rota e nested barrels podem ser removidos.
16. `VALIDATION.md` marca responsividade como aprovada sem evidência de navegador desta rodada.

## Segurança

- **Senha:** senha atual é revalidada server-side; senha nova possui 12+ e classes de caracteres no frontend/backend. Não logar body. Preservar segredo sem trim e limpar estado no fechamento/unmount.
- **Autorização:** página é self-service de qualquer usuário autenticado ativo; não requer capability administrativa. Edge Function valida ator ativo.
- **CSRF:** invoke usa bearer JWT; enforcement é sessão/ator. XSS ainda poderia agir em nome da sessão, portanto CSP/encoding permanecem essenciais.
- **XSS:** React escapa eventos/permissões; sem HTML arbitrário.
- **PII:** IP é dado pessoal. Exibir somente se necessário, mascarar conforme política e não confiar em metadata não documentada. Eventos precisam taxonomia sem PII.
- **Auditoria:** mudança de senha e passkey devem ter evento confiável/correlacionado; falhas de audit não podem ser invisíveis. Exibir permissões técnicas ao próprio usuário é aceitável, mas documentar finalidade.
- **Sessões:** depois de mudança de senha, revogação remota e logout local devem ter resultado explícito; testar sessão atual e demais sessões.

## Acessibilidade e UX

- Pontos fortes: AppPasswordField, dialogs titulados, labels, estados loading/error e layout responsivo.
- O score deve ter papel/valor/texto e nunca depender apenas da cor.
- Anunciar sucesso/erro de passkey e senha; retornar foco; focar primeiro erro; testar teclado/Escape.
- Não rotular dados inferidos como controles concluídos. Adotar estados `completed | action-required | unknown | unavailable`.
- Testar 320–1024 px, zoom 200%, alto contraste e leitores de tela; listas de permissões grandes precisam overflow/quebra previsível.

## Testes

Os quatro casos cobrem render, estados ausentes, single-flight de passkey e happy path de senha com mocks. Faltam:

- senha atual inválida, policy, mesma senha, falha após update, revogação parcial e audit failure;
- preservação de whitespace e limpeza dos campos;
- passkey cancelada/duplicada/origin-RP/reset/audit/refresh;
- sessão indisponível/stale e parsing inválido;
- score `unknown`, telefone não verificado e mensagens corretas por tipo de erro;
- eventos inválidos/PII e Notifications indisponível;
- teclado, foco, progressbar, viewports;
- integração local/Edge negativa e sessão revogada.

## Matriz arquivo a arquivo

| Arquivo | Papel | Achado / ação recomendada |
| --- | --- | --- |
| `components/index.ts` | Barrel de componentes | Remover; imports diretos. |
| `components/security-change-password-dialog.tsx` | Form de senha | Estrutura boa, mas remove whitespace, valida durante change e não foca erro. Preservar segredo e extrair schema/controller. |
| `components/security-summary-card.tsx` | Toda a página de controles | Grande e com inferências enganosas. Dividir score/medidas/eventos/sessão/permissões/passkey result. |
| `constants/security-copy.ts` | Copy | Boa centralização; ajustar linguagem de evidência, sessão e erros; remover fallback hardcoded. |
| `docs/README.md` | Fluxo/limites | Melhor que média do projeto; corrigir afirmações sobre score, IP/sessão e passkey após implementação. |
| `docs/VALIDATION.md` | Checklist | Não registra evidência e sobredeclara responsividade. Consolidar em README/relatório de teste. |
| `hooks/use-security-password-change.ts` | Single-flight + logout | Coeso; modelar resultado parcial/retry e garantir logout após senha efetivamente alterada. |
| `hooks/use-security.ts` | Adapter Auth/sessão | Mistura summary e carregamento; falta erro/parcialidade da sessão e generation guard para troca de usuário. |
| `model/index.ts` | Barrel model | Remover nested barrel. |
| `model/security-models.ts` | Score/eventos | Puro, mas strong-password sempre true e contato inferido. Introduzir evidência/unknown e evitar duplicar regra Notifications. |
| `routes/security-route.tsx` | Composição e ações | Pequena o suficiente, porém mensagem de Alert errada e dependências amplas. Remover default export. |
| `services/security-password-service.ts` | Edge invoke | Fail-closed; separar código/cause/mensagem pública e schema de resposta. |
| `services/security-session-service.ts` | UA/metadata | Não representa necessariamente sessão real; schema/erro ausentes. Renomear como informações locais ou criar endpoint. |
| `types/security-types.ts` | Contratos | Separado, mas depende de Auth amplo e não modela unknown/partial. Estreitar contratos. |

## Critérios de aceite

1. Pontuação inclui apenas controles comprovados e modela desconhecido/indisponível.
2. Passkey conclui backend, audit e profile refresh; cancelamento não gera falso sucesso.
3. Troca de senha tem resultado final previsível, revogação testada e trilha observável.
4. Segredos não são alterados por trim nem aparecem em logs/estado após fechamento.
5. Sessão/IP são verdadeiros e autorizados ou rotulados como estimativas locais; IP segue política de minimização.
6. Erro exibido corresponde à ação real.
7. Testes negativos, integração Edge, teclado/foco e viewports passam.
