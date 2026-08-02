# Validation - Security

- [x] Rota com loading/erro/fallback.
- [x] Score radial derivado de seis medidas suportadas.
- [x] Um único Card com Separator antes das medidas e dos eventos.
- [x] TOTP inscrito/verificado com Supabase Auth.
- [x] Fluxo MFA em método, QR/chave e verificação, sem fator criado antes de Continuar.
- [x] SMS visível como opção futura e indisponível, sem sucesso sintético.
- [x] Código MFA validado por Zod com `aria-invalid` no input e nos seis slots.
- [x] InputOTP responsivo com separador oficial, placeholders zero e sem scroll horizontal.
- [x] Passkey finalizada e auditada no backend antes do sucesso.
- [x] Revisão de logins persistida para sessões dos últimos 30 dias.
- [x] Confiança da sessão atual bloqueada sem AAL2.
- [x] Senha preservada exatamente como digitada.
- [x] Eventos recentes sincronizados com auditoria user-scoped e allowlist de segurança.
- [x] Estrutura de diretórios alinhada ao padrão.
- [x] Alert exibido somente em medida pendente, com orientação contextual.
- [x] RadialBar com domínio fixo de 0 a 100, preenchimento e cor derivados do score.
- [x] Faixas do score: 0–2 Crítico, 3–5 Moderado e 6 Ambiente Seguro.
- [x] Validação visual em 1000x800 e 390x844 sem overflow horizontal.
- [x] Migration aplicada e validada no projeto remoto.

## Evidências de 2026-08-02

- Projeto remoto: `20260802011559_security_posture_sessions`.
- Feed auditado remoto: `20260802032213_security_audit_events`.
- Privilégios: somente `authenticated` executa os três RPCs; `anon` e `service_role` não executam.
- Funções: `security definer`, `search_path = ''`, `auth.uid()` e sessão ativa; confiança exige AAL2.
- Navegador autenticado: score `50/100`, tom `warning`, três medidas pendentes e exatamente três Alerts.
- SVG: arco colorido ocupa 50% do anel, aparece sem animação e usa o token semântico `--warning`.
- MFA validado em 1000x800 e 390x844; Dialog padrão, `scrollWidth === clientWidth` e fator pendente removido ao voltar.
- Feed real validado com senha, redefinição, telefone e passkey; 2 itens iniciais, expansão para 5 e gap real de 20px.
- Testes focados: 18 casos de rota, modelo e schema MFA aprovados.
