export const settingsCopy = {
  page: {
    title: "Configurações",
    subtitle: "Gerencie o perfil da sua conta, segurança e preferências do painel.",
  },
  profile: {
    sectionTitle: "Informações de perfil",
    sectionDescription:
      "Gerencie os dados do seu perfil e mantenha suas informações atualizadas.",
    avatarButtonLabel: "Alterar foto de perfil",
    avatarInputLabel: "Selecionar foto de perfil",
    avatarActionLabel: "Alterar foto",
    saveButton: "Salvar",
    saveFeedback: {
      loading: "Enviando solicitação...",
      success: "Solicitação de alteração de telefone enviada.",
      error: "Não foi possível enviar a solicitação.",
    },
    fields: {
      name: {
        label: "Nome",
        description:
          "Nome completo exibido no sistema, em relatórios e em interações internas da plataforma. Não pode ser alterado por aqui.",
        placeholder: "Nome completo",
      },
      phone: {
        label: "Telefone",
        description:
          "Número de contato usado para comunicação operacional e recuperação de acesso quando necessário. A alteração passa por validação antes de ser aplicada.",
        placeholder: "(00) 00000-0000",
      },
      email: {
        label: "Email",
        description:
          "Endereço principal para notificações da conta, alertas de segurança e confirmações importantes. Não pode ser alterado por aqui.",
        placeholder: "seu.email@exemplo.com",
      },
    },
  },
  identity: {
    sectionTitle: "Identidades da conta",
    sectionDescription:
      "Gerencie suas credenciais de acesso e altere sua senha sempre que necessário.",
    credentialsTitle: "Credenciais",
    credentialsDescription: "Login com CPF e senha",
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
    addMfaApp: {
      title: "Adicionar aplicativo autenticador",
      description:
        "Informe um nome para identificar este aplicativo autenticador.",
      inputLabel: "Nome do aplicativo",
      inputPlaceholder: "Ex: 1Password, Authy...",
      confirmButton: "Adicionar",
      validation: {
        required: "Informe um nome para o aplicativo.",
      },
      feedback: {
        loading: "Adicionando aplicativo...",
        success: "Aplicativo adicionado.",
        error: "Não foi possível adicionar o aplicativo.",
      },
    },
  },
  mfa: {
    sectionTitle: "Autenticação multifatorial (MFA)",
    sectionDescription:
      "Use um aplicativo autenticador (como 1Password ou Authy) para verificar sua identidade no login.",
    addButton: "Adicionar novo aplicativo",
    removeButton: "Remover",
    configuredLabelSingle: "aplicativo configurado",
    configuredLabelPlural: "aplicativos configurados",
    deviceLabel: "Dispositivo",
    addedAtLabel: "Adicionado em",
    removeDialog: {
      title: "Remover aplicativo autenticador",
      description:
        "Tem certeza que deseja remover o dispositivo {{name}}? Você poderá ficar sem acesso em logins protegidos por MFA.",
      confirmLabel: "Remover",
    },
    removeFeedback: {
      loading: "Removendo aplicativo...",
      success: "Aplicativo removido.",
      error: "Não foi possível remover o aplicativo.",
    },
  },
  alert: {
    title: "Evite ficar bloqueado",
    description:
      "Adicione um método de login de backup agora. Caso contrário, perder o acesso ao seu aplicativo autenticador bloqueará permanentemente sua conta.",
  },
} as const
