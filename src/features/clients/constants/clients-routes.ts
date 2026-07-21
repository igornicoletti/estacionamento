export const clientsRoutePaths = {
  list: "/clientes",
  vehicles: (clientId: string | number) => `/clientes/${clientId}`,
} as const
