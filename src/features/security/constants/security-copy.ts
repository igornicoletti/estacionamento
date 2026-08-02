import type { SecurityScore } from "../types/security-types"

export const securityCopy = {
  page: {
    title: "Segurança",
    subtitle: "Revise autenticação, contato de recuperação, sessão atual e eventos recentes.",
  },
  empty: {
    title: "Dados de segurança indisponíveis",
    description: "Não foi possível carregar os dados de segurança desta conta.",
    action: "Recarregar",
  },
  error: {
    title: "Falha ao carregar segurança",
    action: "Tentar novamente",
    noticeTitle: "Não foi possível concluir a ação",
  },
  score: {
    title: "Pontuação de segurança",
    completed: (score: SecurityScore) =>
      `${score.completed} de ${score.total} medidas de segurança concluídas`,
    remaining: (score: SecurityScore) =>
      score.remaining === 0
        ? "As medidas de segurança disponíveis estão configuradas."
        : score.remaining === 1
          ? "Há 1 medida de segurança que requer atenção."
          : `Há ${score.remaining} medidas de segurança que requerem atenção.`,
    labels: {
      error: "Crítico",
      info: "Crítico",
      success: "Ambiente Seguro",
      warning: "Moderado",
    },
  },
  status: {
    completed: "Feito",
    actionRequired: "Pendente",
  },
  controls: {
    title: "Controles da conta",
    description: "Medidas suportadas pelo projeto para autenticação e recuperação.",
  },
  measures: {
    twoFactorAuthentication: {
      title: "Autenticação de dois fatores",
      description:
        "Adicione uma segunda camada de proteção com um aplicativo autenticador ou chave de segurança",
      action: "Configurar",
      actionLabel: "Configurar autenticação de dois fatores",
      guidance: {
        title: "Reduza o risco de acesso indevido",
        description:
          "Ative a autenticação de dois fatores para exigir uma verificação adicional quando a senha for comprometida.",
      },
    },
    strongPassword: {
      title: "Senha forte",
      description:
        "Use pelo menos 12 caracteres com letras maiúsculas, minúsculas, números e símbolos",
      action: "Trocar",
      actionLabel: "Trocar senha",
      guidance: {
        title: "Use uma senha exclusiva",
        description:
          "Evite reutilizar credenciais de outros serviços e não compartilhe sua senha com outras pessoas.",
      },
    },
    passkey: {
      title: "Chave de acesso inscrita",
      activeDescription:
        "Faça login de forma mais rápida e segura com uma senha vinculada ao dispositivo",
      inactiveDescription:
        "Faça login de forma mais rápida e segura com uma senha vinculada ao dispositivo",
      addAction: "Configurar",
      actionLabel: "Configurar chave de acesso",
      guidance: {
        title: "O que são chaves de acesso?",
        description:
          "As chaves de acesso usam FIDO2/WebAuthn e biometria ou uma chave física para reduzir a exposição a phishing e roubo de credenciais.",
      },
      rotateAction: "Gerar nova passkey",
      activating: "Gerando passkey...",
      dialogTitle: "Passkey gerada",
      dialogDescription: "A passkey foi salva no gerenciador de credenciais do dispositivo.",
      dialogClose: "Entendi",
      name: "Nome da credencial",
      createdAt: "Criada em",
    },
    recoveryContact: {
      title: "Contato de recuperação",
      configuredDescription: "Telefone de recuperação cadastrado para suporte administrativo.",
      missingDescription: "Cadastre um telefone no perfil para apoiar solicitações de recuperação.",
      updateAction: "Atualizar contato",
    },
    recoveryOptions: {
      title: "Opções de recuperação configuradas",
      description:
        "E-mail de backup e número de telefone definidos para recuperação de conta",
      action: "Configurar",
      actionLabel: "Configurar recuperação",
      guidance: {
        title: "Mantenha os contatos atualizados",
        description:
          "Revise seu e-mail e telefone para que solicitações de recuperação possam ser confirmadas pelos canais cadastrados.",
      },
    },
    recentLogins: {
      title: "Logins recentes revisados",
      description:
        "Verifique se há dispositivos ou locais não reconhecidos nos últimos 30 dias",
      action: "Revisar",
      actionLabel: "Revisar logins",
      guidance: {
        title: "Verifique a atividade da conta",
        description:
          "Confira datas, dispositivos e endereços de rede. Comunique acessos que você não reconhece ao suporte responsável.",
      },
    },
    trustedDevices: {
      title: "Dispositivos confiáveis configurados",
      description:
        "Somente dispositivos verificados podem acessar sua conta sem verificação adicional",
      action: "Confiar",
      actionLabel: "Confiar neste dispositivo",
      saving: "Salvando...",
      guidance: {
        title: "Use somente dispositivos confiáveis",
        description:
          "Não marque equipamentos públicos ou compartilhados como confiáveis. Remova o acesso ao encerrar o uso desses dispositivos.",
      },
    },
  },
  events: {
    title: "Eventos de segurança recentes",
    description: "Notificações de segurança entregues ao seu usuário.",
    viewAll: (count: number) => `Ver todos os ${count}`,
    showLess: "Ver menos",
    loading: "Carregando...",
    emptyTitle: "Sem eventos recentes",
    emptyDescription: "Quando houver uma atualização de segurança, ela aparecerá aqui.",
    error: "Não foi possível carregar os eventos recentes.",
    unavailableDate: "Data indisponível",
  },
  auditEvents: {
    access_recovery_requested: {
      title: "Recuperação solicitada",
      description: "Uma solicitação de recuperação de acesso foi registrada.",
    },
    access_recovery_reviewed: {
      title: "Recuperação analisada",
      description: "Uma solicitação de recuperação de acesso foi analisada.",
    },
    account_locked: {
      title: "Conta bloqueada",
      description: "A conta foi bloqueada após tentativas de acesso sem sucesso.",
    },
    mfa_enabled: {
      title: "Autenticação de dois fatores ativada",
      description: "Um método adicional de verificação foi configurado.",
    },
    passkey_registered: {
      title: "Chave de acesso configurada",
      description: "Uma chave de acesso foi vinculada à conta.",
    },
    passkey_reset_requested: {
      title: "Recadastro de chave solicitado",
      description: "O recadastro das chaves de acesso foi solicitado.",
    },
    password_changed: {
      title: "Senha alterada",
      description: "A senha de acesso da conta foi alterada.",
    },
    password_reset_requested: {
      title: "Redefinição de senha solicitada",
      description: "Uma redefinição administrativa de senha foi solicitada.",
    },
    phone_change_requested: {
      title: "Alteração de telefone registrada",
      description: "Uma alteração do telefone de contato foi registrada.",
    },
    profile_updated: {
      title: "Perfil atualizado",
      description: "Nome, foto ou contatos da conta foram atualizados.",
    },
    security_device_trusted: {
      title: "Dispositivo confiável",
      description: "A sessão atual foi marcada como dispositivo confiável.",
    },
    security_logins_reviewed: {
      title: "Logins revisados",
      description: "As sessões ativas dos últimos 30 dias foram revisadas.",
    },
    sessions_revoked: {
      title: "Sessões revogadas",
      description: "As sessões ativas da conta foram encerradas.",
    },
    temporary_lock_cleared: {
      title: "Bloqueio temporário removido",
      description: "O bloqueio temporário da conta foi removido.",
    },
    user_blocked: {
      title: "Acesso bloqueado",
      description: "O acesso da conta foi bloqueado administrativamente.",
    },
    user_unblocked: {
      title: "Acesso desbloqueado",
      description: "O acesso da conta foi restaurado administrativamente.",
    },
  },
  mfaDialog: {
    title: "Autenticação de dois fatores",
    description: "Adicione uma camada extra de segurança à sua conta.",
    methodTitle: "Escolha o método de verificação",
    methodDescription: "Selecione como deseja receber os códigos de acesso.",
    authenticatorTitle: "Aplicativo",
    authenticatorDescription:
      "Use Google Authenticator, Authy ou 1Password para gerar códigos.",
    smsTitle: "SMS",
    smsDescription: "Receba um código no telefone cadastrado.",
    recommended: "Recomendado",
    comingSoon: "Em breve",
    setupTitle: "Escaneie com seu aplicativo",
    setupDescription:
      "Abra o autenticador, adicione uma conta e escaneie o código.",
    qrCodeAlt: "QR Code para configurar o aplicativo autenticador",
    secretDescription: "Ou insira esta chave no aplicativo",
    copySecret: "Copiar chave",
    secretCopied: "Chave copiada.",
    secretCopyError: "Não foi possível copiar a chave.",
    preparing: "Preparando QR Code...",
    verifyTitle: "Insira o código de verificação",
    verifyDescription:
      "Digite o código de 6 dígitos exibido no aplicativo autenticador.",
    codeLabel: "Código de verificação",
    invalidCode: "Informe os 6 dígitos do aplicativo.",
    cancel: "Cancelar",
    back: "Voltar",
    continue: "Continuar",
    enable: "Habilitar",
    enabling: "Habilitando...",
  },
  loginsDialog: {
    title: "Revisar logins recentes",
    description:
      "Confirme os dispositivos e locais reconhecidos que acessaram sua conta nos últimos 30 dias.",
    empty: "Nenhum login ativo foi encontrado nos últimos 30 dias.",
    unknownIp: "IP não informado",
    current: "Sessão atual",
    trusted: "Confiável",
    cancel: "Cancelar",
    confirm: "Revisar",
  },
  session: {
    title: "Sessão atual",
    description: "Dados disponíveis da sessão autenticada neste navegador.",
    browser: "Navegador",
    operatingSystem: "Sistema operacional",
    ip: "IP",
    authenticatedAt: "Última autenticação",
    unavailable: "Não informado",
  },
  permissions: {
    title: "Permissões efetivas",
    description: "Permissões recebidas pelo perfil ativo nesta sessão.",
    wildcard: "Acesso total",
    none: "Nenhuma permissão explícita vinculada à sessão.",
    count: (count: number) => (count === 1 ? "1 permissão ativa" : `${count} permissões ativas`),
  },
  passwordDialog: {
    title: "Alterar senha",
    description: "Informe a senha atual e defina uma nova senha de acesso.",
    currentLabel: "Senha atual",
    newLabel: "Nova senha",
    confirmLabel: "Confirme a nova senha",
    hint: "Mínimo 12 caracteres com maiúscula, minúscula, número e símbolo.",
    mismatch: "As senhas não coincidem.",
    sameAsCurrent: "A nova senha deve ser diferente da atual.",
    cancel: "Cancelar",
    save: "Salvar",
    saving: "Salvando...",
  },
  feedback: {
    mfa: {
      loading: "Preparando autenticação...",
      success: "Autenticação de dois fatores configurada.",
      error: "Não foi possível configurar a autenticação de dois fatores.",
      cancelError: "Não foi possível voltar agora.",
    },
    reviewLogins: {
      loading: "Registrando revisão...",
      success: "Logins recentes revisados.",
      error: "Não foi possível registrar a revisão dos logins.",
    },
    trustDevice: {
      loading: "Configurando dispositivo...",
      success: "Dispositivo configurado como confiável.",
      error: "Não foi possível confiar neste dispositivo.",
      mfaRequired: "Configure a autenticação de dois fatores primeiro.",
    },
    passkey: {
      loading: "Aguardando...",
      success: "Passkey ativada.",
      error: "Não foi possível ativar a passkey.",
    },
    password: {
      loading: "Alterando...",
      success: "Senha alterada. Faça login novamente com a nova senha.",
      error: "Não foi possível alterar a senha. Verifique a senha atual.",
    },
  },
} as const
