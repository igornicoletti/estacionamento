# Fluxo de Recuperação de Acesso

O usuário acessa `/recuperar-acesso` quando perdeu/trocou celular, esqueceu senha fallback ou bloqueou a conta por tentativas.

Campos públicos:

- CPF.
- Telefone.
- Email, se possuir.
- Motivo.
- Descrição opcional.

Resposta pública:

- Sempre genérica.
- Nunca revela se CPF existe, status, nome ou motivo real.

Tratamento administrativo:

- Admin avalia `access_recovery_requests`.
- Pode resetar senha, resetar passkey, limpar bloqueio, revogar sessões ou negar.
- Toda decisão exige motivo e auditoria.
