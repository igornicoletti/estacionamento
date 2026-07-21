export const unitsRoutePaths = {
  list: "/unidades",
  users: (unitId: string | number) => `/unidades/${unitId}/usuarios`,
} as const
