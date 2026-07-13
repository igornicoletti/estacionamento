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
    action: "Tentar novamente",
  },
  profile: {
    sectionTitle: "Informações da conta",
    sectionDescription:
      "Dados efetivos retornados pela sessão autenticada. Alterações sensíveis devem ser executadas por fluxo administrativo ou backend dedicado.",
    fields: {
      name: "Nome",
      cpf: "CPF",
      email: "E-mail",
      phone: "Telefone",
      role: "Perfil",
      unit: "Unidade",
      status: "Status da conta",
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
    permissionsTitle: "Permissões efetivas",
    permissionsDescription:
      "Permissões resolvidas pelo backend para a sessão atual. A autorização real permanece nas policies, RPCs e Edge Functions.",
    permissionsCount: (count: number) =>
      count === 1 ? "1 permissão ativa" : `${count} permissões ativas`,
    wildcardPermission: "Acesso total",
    sessionTitle: "Sessão",
    sessionAuthenticated: "Autenticada",
    sessionAnonymous: "Anônima",
  },
  audit: {
    readOnlyTitle: "Modo somente leitura",
    readOnlyDescription:
      "Esta tela não simula alteração de senha, passkey ou telefone. Ações desse tipo exigem contrato backend explícito.",
  },
} as const
