export const settingsCopy = {
  page: {
    title: "Configurações",
    subtitle: "Gerencie o perfil, a segurança e as credenciais da sua conta.",
  },
  profile: {
    sectionTitle: "Informações de perfil",
    sectionDescription:
      "Dados da sua conta. Alguns campos exigem validação e não são aplicados imediatamente.",
    avatar: {
      title: "Foto de perfil",
      description: "Arraste uma imagem ou selecione um arquivo do seu dispositivo.",
      dropzoneLabel: "Área para envio da foto de perfil",
      allowedFormats: "Formatos aceitos: PNG, JPG ou WEBP",
      maxSize: "Tamanho máximo: 2 MB",
      invalidFormat: "Formato de arquivo não permitido.",
      tooLarge: "O arquivo excede o tamanho máximo permitido.",
      removeButton: "Remover foto",
    },
    saveButton: "Salvar alterações",
    saveFeedback: {
      loading: "Enviando solicitação...",
      success: "Solicitação de alteração de telefone enviada para validação.",
      error: "Não foi possível enviar a solicitação.",
    },
    fields: {
      name: {
        label: "Nome",
        description: "Nome completo exibido no sistema e em relatórios.",
        helper: "Gerenciado pela administração. Entre em contato com o suporte para alterar.",
        placeholder: "Nome completo",
      },
      cpf: {
        label: "CPF",
        description: "Documento utilizado para validação de identidade e auditoria de acesso.",
        helper: "O CPF não pode ser exibido por completo nem alterado por segurança.",
        placeholder: "000.000.000-00",
      },
      phone: {
        label: "Telefone",
        description: "Número de contato usado para recuperação de acesso e verificação em duas etapas.",
        helper: "A alteração exige validação do novo número antes de ser aplicada.",
        placeholder: "(00) 00000-0000",
      },
      email: {
        label: "Email",
        description: "Endereço usado para notificações da conta e alertas de segurança.",
        helper: "Gerenciado pela administração. Entre em contato com o suporte para alterar.",
        placeholder: "seu.email@exemplo.com",
      },
    },
  },
  identity: {
    sectionTitle: "Credenciais de acesso",
    sectionDescription: "Gerencie a senha utilizada para entrar com seu CPF.",
    credentialsTitle: "Senha de acesso",
    credentialsDescription: "Login realizado com CPF e senha.",
    changePasswordButton: "Alterar senha",
  },
  dialogs: {
    cancel: "Cancelar",
    changePassword: {
      title: "Alterar senha",
      description:
        "Informe sua senha atual e escolha uma nova senha para continuar.",
      fields: {
        current: "Senha atual",
        newPassword: "Nova senha",
        confirm: "Confirmar senha",
      },
      confirmButton: "Salvar",
      validation: {
        currentRequired: "Informe a senha atual.",
        newRequired: "Informe a nova senha.",
        confirmRequired: "Confirme a nova senha.",
        mismatch: "As senhas não coincidem.",
      },
      feedback: {
        loading: "Alterando senha...",
        success: "Senha alterada.",
        error: "Não foi possível alterar a senha.",
      },
    },
  },
  mfa: {
    sectionTitle: "Autenticação multifator (MFA)",
    sectionDescription:
      "Verificamos sua identidade a partir dos canais de contato confirmados (telefone ou email).",
    statusLabel: "Status",
    statusActive: "Ativo",
    statusInactive: "Inativo",
    statusActiveDescription: "Você possui ao menos um canal de contato verificado.",
    statusInactiveDescription:
      "Nenhum canal de contato foi verificado ainda. Confirme seu telefone ou email para ativar.",
  },
} as const
