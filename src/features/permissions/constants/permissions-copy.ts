export const permissionsCopy = {
  page: {
    title: "Perfis e permissões",
    subtitle:
      "Consulte a matriz efetiva de permissões por perfil registrada no banco.",
  },
  filters: {
    groups: "Grupos",
    source: "Origem",
    searchPlaceholder: "Buscar permissões...",
  },
  labels: {
    permission: "Permissão",
    group: "Grupo",
    source: "Origem",
    rolesWithAccess: "Perfis com acesso",
    rolesWithoutAccess: "Perfis sem acesso",
    totalRoles: "Total de perfis",
    critical: "Crítica",
    description: "Descrição",
    key: "Chave",
    emptyValue: "—",
    noneRole: "Nenhum perfil",
    noRoleWithoutAccess: "Nenhum",
    yes: "Sim",
    no: "Não",
  },
  details: {
    title: "Detalhes da permissão",
    description:
      "Consulte a classificação e os perfis com acesso à permissão selecionada.",
  },
  accessibility: {
    withAccess: "Perfil com acesso",
    withoutAccess: "Perfil sem acesso",
  },
  actions: {
    details: "Detalhes",
    retry: "Recarregar",
  },
  empty: {
    title: "Nenhuma permissão cadastrada",
    description:
      "A matriz de permissões ainda não foi carregada no banco.",
  },
  filteredEmpty: {
    title: "Nenhuma permissão encontrada",
    description:
      "Ajuste o termo de busca ou os filtros para localizar uma permissão.",
  },
  error: {
    load: "Não foi possível carregar a matriz de permissões.",
    invalidResponse: "A resposta da matriz de permissões é inválida.",
    sessionRequired: "Sua sessão expirou. Faça login novamente para continuar.",
    unavailable: "O serviço de permissões não está configurado.",
  },
} as const
