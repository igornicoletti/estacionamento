import { type RecoveryReason } from "./schemas"

export const authCopy = {
  feedback: {
    genericAuthError: "Não foi possível continuar com os dados informados.",
    passkeyAuthError:
      "Não foi possível autenticar com passkey. Use CPF e senha ou recupere o acesso.",
    genericRecoveryResponse:
      "Se os dados puderem ser validados, a solicitação será analisada pela administração.",
    supabaseNotConfigured:
      "Supabase não está configurado para este ambiente.",
  },
  login: {
    title: "Acessar sistema",
    description: "Informe seu CPF e senha para continuar.",
    submit: "Continuar",
    recoveryLink: "Recuperar acesso",
    passwordLabel: "Senha",
    passwordDescription: "Use sua senha temporária ou fallback.",
    passwordRequired: "Informe sua senha.",
    confirmNewPasswordRequired: "Confirme a nova senha.",
    confirmNewPasswordMismatch: "As senhas não conferem.",
    cpfInvalid: "Informe um CPF válido.",
    passkeyRegistration: "Cadastrar passkey",
    passkeyLogin: "Entrar com passkey",
    newPasswordDescription:
      "12 caracteres, com letras maiúsculas, minúsculas, números e caractere especial.",
  },
  recovery: {
    title: "Recuperar acesso",
    description: "Solicite análise administrativa para senha, passkey ou bloqueio.",
    phoneDescription: "Usaremos apenas para análise da solicitação.",
    reasonPlaceholder: "Selecione o motivo",
    otherDescriptionLabel: "Descrição",
    otherDescriptionRequired: "Descreva o motivo da solicitação.",
    submit: "Enviar solicitação",
    backToLogin: "Voltar para login",
  },
} as const

export const recoveryReasonOptions = [
  { label: "Perdi ou troquei de celular", value: "lost_phone" },
  { label: "Esqueci minha senha", value: "forgot_password" },
  { label: "Bloqueio por tentativas", value: "attempts_blocked" },
  { label: "Outro motivo", value: "other" },
] as const satisfies readonly { label: string; value: RecoveryReason }[]
