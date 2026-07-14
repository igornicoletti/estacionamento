export const settingsCopy = {
  page: {
    title: "Meu perfil",
    subtitle: "Consulte os dados da sua conta, sessão, permissões e credenciais cadastradas.",
  },
  loading: {
    profile: "Carregando perfil",
  },
  empty: {
    title: "Perfil não disponível",
    description:
      "Não foi possível carregar os dados da sua conta. Recarregue a sessão ou faça login novamente.",
    action: "Recarregar perfil",
  },
  error: {
    title: "Falha ao carregar perfil",
    noticeTitle: "Não foi possível concluir a ação",
    action: "Tentar novamente",
  },
  profile: {
    sectionTitle: "Informações da conta",
    sectionDescription:
      "Atualize os dados públicos da sua conta. Campos protegidos permanecem bloqueados.",
    avatarTitle: "Foto do perfil",
    avatarDescription: "Atualize o avatar exibido no menu e nas telas administrativas.",
    avatarUpload: "Enviar foto",
    avatarHint: "JPG, PNG ou WebP. Máximo de 5 MB. Imagem quadrada recomendada.",
    accountTitle: "Dados editáveis",
    accountDescription: "Atualize os dados de contato exibidos no sistema.",
    nameDescription: "Nome exibido no menu, registros administrativos e telas internas.",
    emailDescription: "E-mail usado como contato administrativo da conta.",
    phoneDescription: "Telefone de contato do usuário.",
    protectedTitle: "Dados protegidos",
    protectedDescription: "Informações administrativas sem edição direta nesta tela.",
    save: "Salvar alterações",
    saving: "Salvando...",
    fields: {
      name: "Nome",
      cpf: "CPF",
      email: "E-mail",
      phone: "Telefone",
      role: "Perfil",
      unit: "Unidade",
    },
    fallback: "—",
    globalUnit: "Escopo global",
    noEmail: "Sem e-mail cadastrado",
    noPhone: "Sem telefone cadastrado",
    noCpf: "CPF protegido",
    noRole: "Sem perfil definido",
  },
  security: {
    sectionTitle: "Segurança e credenciais",
    sectionDescription:
      "Resumo das credenciais e permissões vinculadas à sessão atual.",
    passkeyTitle: "Passkey",
    passkeyActive: "Ativa",
    passkeyInactive: "Inativa",
    passkeyActiveDescription: "Existe ao menos uma passkey associada à sua conta.",
    passkeyInactiveDescription:
      "Nenhuma passkey ativa foi identificada para esta conta.",
    passkeyActivate: "Gerar nova passkey",
    passkeyActivating: "Gerando passkey...",
    passkeyDialogTitle: "Passkey gerada",
    passkeyDialogDescription:
      "A passkey foi salva no gerenciador de credenciais deste dispositivo.",
    passkeyDialogClose: "Entendi",
    passkeyName: "Nome da credencial",
    passkeyCreatedAt: "Criada em",
    passkeyInstructionTitle: "Como utilizar",
    passkeyInstructionDescription:
      "Na próxima entrada, selecione Entrar com passkey e confirme com o desbloqueio do dispositivo ou gerenciador de senhas.",
    permissionsTitle: "Permissões efetivas",
    permissionsDescription:
      "Permissões resolvidas pelo backend para a sessão atual. A autorização real permanece nas policies, RPCs e Edge Functions.",
    permissionsCount: (count: number) =>
      count === 1 ? "1 permissão ativa" : `${count} permissões ativas`,
    wildcardPermission: "Acesso total",
    sessionTitle: "Sessão",
    sessionDescription: "Dados identificados nesta sessão autenticada.",
    sessionAnonymous: "Sessão não autenticada",
    sessionBrowser: "Navegador",
    sessionOperatingSystem: "Sistema operacional",
    sessionIp: "IP",
    sessionAuthenticatedAt: "Última autenticação",
    sessionUnavailable: "Não informado",
  },
  audit: {
    readOnlyTitle: "Alterações auditadas",
    readOnlyDescription:
      "Alterações de perfil e credenciais ficam registradas para rastreabilidade administrativa.",
  },
  photoDialog: {
    title: "Alterar foto",
    description: "Envie uma imagem ou informe a URL de uma foto pública.",
    uploadTab: "Upload file",
    urlTab: "From URL",
    dropTitle: "Arraste e solte ou selecione uma imagem",
    dropDescription: "PNG, JPG ou WebP até 5 MB.",
    browse: "Buscar arquivo",
    urlLabel: "URL da imagem",
    urlPlaceholder: "https://exemplo.com/avatar.png",
    cancel: "Cancelar",
    save: "Salvar foto",
    saving: "Salvando...",
  },
  feedback: {
    profile: {
      loading: "Salvando perfil...",
      success: "Perfil atualizado.",
      error: "Não foi possível atualizar o perfil.",
    },
    passkey: {
      loading: "Aguardando validação da passkey...",
      success: "Passkey ativada.",
      error: "Não foi possível ativar a passkey.",
    },
  },
} as const
