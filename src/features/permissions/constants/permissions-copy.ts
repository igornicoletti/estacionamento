export const permissionsCopy = {
  page: {
    title: "Perfis e permissões",
    subtitle:
      "Consulte a matriz efetiva de permissões por perfil registrada no banco.",
  },
  filters: {
    groups: "Grupos",
  },
  table: {
    ariaLabel: "Matriz de permissões por perfil",
    searchPlaceholder: "Buscar permissões...",
  },
  labels: {
    permission: "Permissão",
    group: "Grupo",
    rolesWithAccess: "Perfis com acesso",
    rolesWithoutAccess: "Perfis sem acesso",
    totalRoles: "Total de perfis",
    description: "Descrição",
    key: "Chave",
    emptyValue: "—",
    unknownGroup: "Grupo não classificado",
    noneRole: "Nenhum perfil",
    noRoleWithoutAccess: "Nenhum",
  },
  details: {
    title: "Detalhes da permissão",
    description:
      "Consulte a chave técnica e os perfis com acesso à permissão selecionada.",
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
    unavailable: "O serviço de permissões não está configurado.",
  },
} as const
