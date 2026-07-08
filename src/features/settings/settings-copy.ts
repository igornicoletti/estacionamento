export const settingsCopy = {
  page: {
    title: "Configurações",
    subtitle: "Gerencie o perfil, a segurança e as credenciais da sua conta.",
  },
  profile: {
    sectionTitle: "Informações de perfil",
    sectionDescription:
      "Dados da sua conta. Alguns campos exigem validação e não são aplicados imediatamente.",
    saveButton: "Salvar alterações",
    saveFeedback: {
      loading: "Enviando solicitação...",
      success: "Solicitação de alteração de telefone enviada para validação.",
      error: "Não foi possível enviar a solicitação.",
    },
    avatar: {
      dropzoneLabel: "Enviar foto de perfil",
      title: "Envie uma foto de perfil",
      description: "Arraste e solte uma imagem aqui ou clique para selecionar.",
      allowedFormats: "PNG, JPEG ou WEBP",
      maxSize: "até 2MB",
      invalidFormat: "Formato de imagem não suportado.",
      tooLarge: "A imagem excede o tamanho máximo permitido.",
      removeButton: "Remover imagem",
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
  passkey: {
    sectionTitle: "Passkey",
    sectionDescription:
      "Use uma credencial WebAuthn do seu dispositivo ou gerenciador de senhas para entrar com passkey.",
    statusLabel: "Status",
    statusActive: "Ativa",
    statusInactive: "Inativa",
    statusActiveDescription: "Você possui ao menos uma passkey cadastrada.",
    statusInactiveDescription:
      "Nenhuma passkey foi cadastrada ainda. Cadastre uma credencial para habilitar o acesso sem senha.",
    enableButton: "Cadastrar passkey",
    enableFeedback: {
      loading: "Abrindo cadastro de passkey...",
      success: "Passkey cadastrada.",
      error: "Não foi possível cadastrar a passkey.",
    },
  },
} as const
