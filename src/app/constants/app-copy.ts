export const appCopy = {
  loading: {
    route: "Carregando aplicação",
  },
  navigation: {
    homeLabel: "Dashboard",
  },
  routeGroups: {
    workspace: "",
    records: "Cadastros",
    commercial: "",
    access: "Configurações",
    monitoring: "Monitoramento",
    utilities: "Configurações",
  },
  routes: {
    home: {
      label: "Dashboard",
      description: "Página inicial da área autenticada.",
    },
    units: {
      label: "Unidades",
      description: "Acompanhar unidades sincronizadas do ERP.",
    },
    clients: {
      label: "Clientes",
      description: "Acompanhar clientes sincronizados do ERP.",
    },
    clientVehicles: {
      label: "Veículos do cliente",
      description: "Acompanhar veículos vinculados ao cliente.",
    },
    prices: {
      label: "Preços",
      description: "Gerenciar tabelas e políticas de preços.",
    },
    rules: {
      label: "Regras",
      description: "Gerenciar regras VIP e critérios comerciais.",
    },
    users: {
      label: "Usuários",
      description: "Gerenciar usuários e acessos ao sistema.",
    },
    accessRequests: {
      label: "Solicitações de acesso",
      description: "Analisar solicitações administrativas de recuperação e acesso.",
    },
    permissions: {
      label: "Perfis e permissões",
      description: "Consultar políticas, permissões e perfis disponíveis.",
    },
    audit: {
      label: "Auditoria",
      description: "Acompanhar eventos de segurança e ações do sistema.",
    },
    notifications: {
      label: "Notificações",
      description: "Acompanhar notificações e alertas recentes.",
    },
    profile: {
      label: "Meu perfil",
      description: "Gerenciar dados pessoais, contato e foto da conta.",
    },
    security: {
      label: "Segurança",
      description: "Gerenciar credenciais, sessão e permissões efetivas.",
    },
    settings: {
      label: "Meu perfil",
      description: "Rota legada redirecionada para Meu perfil.",
    },
    login: {
      label: "Entrar",
      description: "Autenticação por CPF e senha.",
    },
    recovery: {
      label: "Recuperar acesso",
      description: "Solicitação de recuperação de acesso.",
    },
    yard: {
      label: "Pátio Virtual",
      description: "Visualizar ocupação e movimentação do pátio em tempo real.",
    },
    reports: {
      label: "Relatórios",
      description: "Consultar relatórios operacionais e indicadores por unidade.",
    },
  },
  fallback: {
    accessDenied: {
      title: "403 — Acesso negado",
      description:
        "Sua conta não possui permissão para acessar esta área. Solicite liberação a um administrador se este acesso fizer parte da sua função.",
      action: "Voltar para o início",
    },
    notFound: {
      title: "404 — Página não encontrada",
      description:
        "A página solicitada não existe, foi movida ou não está disponível para sua conta.",
      action: "Voltar para o início",
    },
    authenticatedHome: {
      title: "Área autenticada",
      description:
        "Use a navegação lateral para acessar os módulos liberados para sua conta.",
    },
  },
  routeError: {
    action: "Voltar para o início",
    retry: "Tentar novamente",
    unexpected: {
      title: "Erro inesperado",
      description:
        "A aplicação encontrou uma falha inesperada ao renderizar esta rota.",
    },
    byStatus: {
      400: {
        title: "400 — Requisição inválida",
        description: "A navegação solicitada contém dados inválidos.",
      },
      401: {
        title: "401 — Sessão inválida",
        description: "Sua sessão não permite concluir esta navegação.",
      },
      403: {
        title: "403 — Acesso negado",
        description: "Sua conta não possui permissão para acessar esta área.",
      },
      404: {
        title: "404 — Página não encontrada",
        description: "A rota ou recurso solicitado não foi encontrado.",
      },
      500: {
        title: "500 — Erro interno",
        description: "A aplicação encontrou uma falha ao renderizar esta rota.",
      },
    },
  },
} as const
