import { AUTH_PERMISSION, type AuthPermission } from "@/features/auth";
import { appCopy } from "../constants/app-copy";

import { routeLazyLoaders, type LazyRouteLoader } from "./route-lazy-loaders";

export const appRouteIds = {
  root: "root",
  auth: "auth",
  login: "auth.login",
  recovery: "auth.recovery",
  app: "app",
  home: "app.home",
  units: "app.units",
  unitUsers: "app.unitUsers",
  clients: "app.clients",
  clientVehicles: "app.clientVehicles",
  prices: "app.prices",
  rules: "app.rules",
  users: "app.users",
  accessRequests: "app.accessRequests",
  permissions: "app.permissions",
  audit: "app.audit",
  notifications: "app.notifications",
  profile: "app.profile",
  security: "app.security",
  yard: "app.yard",
  reports: "app.reports",
  notFound: "not-found",
} as const;

export const appRoutePaths = {
  home: "/",
  login: "/login",
  recovery: "/recuperar-acesso",
  units: "/unidades",
  clients: "/clientes",
  prices: "/precos",
  rules: "/regras",
  users: "/usuarios",
  accessRequests: "/solicitacoes-acesso",
  permissions: "/perfis-permissoes",
  audit: "/auditoria",
  notifications: "/notificacoes",
  profile: "/meu-perfil",
  security: "/seguranca",
  yard: "/patio-virtual",
  reports: "/relatorios",
} as const satisfies Record<string, `/${string}`>;

export const appRouteSegments = {
  login: "login",
  recovery: "recuperar-acesso",
  units: "unidades",
  unitUsers: "unidades/:cod_empresa/usuarios",
  clients: "clientes",
  clientVehicles: "clientes/:cod_pessoa",
  prices: "precos",
  rules: "regras",
  users: "usuarios",
  accessRequests: "solicitacoes-acesso",
  permissions: "perfis-permissoes",
  audit: "auditoria",
  notifications: "notificacoes",
  profile: "meu-perfil",
  security: "seguranca",
  yard: "patio-virtual",
  reports: "relatorios",
} as const;

export const appRouteGroupIds = {
  workspace: "workspace",
  records: "records",
  monitoring: "monitoring",
  utilities: "utilities",
} as const;

export const appPermissionKeys = AUTH_PERMISSION;

export type AppRouteId = (typeof appRouteIds)[keyof typeof appRouteIds];
export type AppRoutePath = (typeof appRoutePaths)[keyof typeof appRoutePaths];
export type AppRouteGroupId =
  (typeof appRouteGroupIds)[keyof typeof appRouteGroupIds];
export type AppRouteAvailability = "all" | "development";

export interface AppRouteRegistryItem {
  id: AppRouteId;
  path?: string;
  href?: AppRoutePath;
  index?: boolean;
  label: string;
  description: string;
  availability?: AppRouteAvailability;
  requiredPermissions?: readonly AuthPermission[];
  lazy?: LazyRouteLoader;
  navigation?: {
    group: AppRouteGroupId;
    order: number;
  };
}

export const publicRouteRegistry = [
  {
    id: appRouteIds.login,
    path: appRouteSegments.login,
    href: appRoutePaths.login,
    label: appCopy.routes.login.label,
    description: appCopy.routes.login.description,
    lazy: routeLazyLoaders.login,
  },
  {
    id: appRouteIds.recovery,
    path: appRouteSegments.recovery,
    href: appRoutePaths.recovery,
    label: appCopy.routes.recovery.label,
    description: appCopy.routes.recovery.description,
    lazy: routeLazyLoaders.recovery,
  },
] as const satisfies readonly AppRouteRegistryItem[];

const registeredAuthenticatedRoutes = [
  {
    id: appRouteIds.home,
    index: true,
    href: appRoutePaths.home,
    label: appCopy.routes.home.label,
    description: appCopy.routes.home.description,
    lazy: routeLazyLoaders.home,
    navigation: import.meta.env.DEV
      ? {
          group: appRouteGroupIds.workspace,
          order: 0,
        }
      : undefined,
  },
  {
    id: appRouteIds.yard,
    availability: "development",
    path: appRouteSegments.yard,
    href: appRoutePaths.yard,
    label: appCopy.routes.yard.label,
    description: appCopy.routes.yard.description,
    requiredPermissions: [appPermissionKeys.unitsRead],
    lazy: routeLazyLoaders.yard,
    navigation: {
      group: appRouteGroupIds.workspace,
      order: 1,
    },
  },
  {
    id: appRouteIds.reports,
    availability: "development",
    path: appRouteSegments.reports,
    href: appRoutePaths.reports,
    label: appCopy.routes.reports.label,
    description: appCopy.routes.reports.description,
    requiredPermissions: [appPermissionKeys.unitsRead],
    lazy: routeLazyLoaders.reports,
    navigation: {
      group: appRouteGroupIds.workspace,
      order: 2,
    },
  },
  {
    id: appRouteIds.units,
    path: appRouteSegments.units,
    href: appRoutePaths.units,
    label: appCopy.routes.units.label,
    description: appCopy.routes.units.description,
    requiredPermissions: [appPermissionKeys.unitsRead],
    lazy: routeLazyLoaders.units,
    navigation: {
      group: appRouteGroupIds.records,
      order: 10,
    },
  },
  {
    id: appRouteIds.clients,
    path: appRouteSegments.clients,
    href: appRoutePaths.clients,
    label: appCopy.routes.clients.label,
    description: appCopy.routes.clients.description,
    requiredPermissions: [appPermissionKeys.clientsRead],
    lazy: routeLazyLoaders.clients,
    navigation: {
      group: appRouteGroupIds.records,
      order: 20,
    },
  },
  {
    id: appRouteIds.prices,
    path: appRouteSegments.prices,
    href: appRoutePaths.prices,
    label: appCopy.routes.prices.label,
    description: appCopy.routes.prices.description,
    requiredPermissions: [appPermissionKeys.pricesRead],
    lazy: routeLazyLoaders.prices,
    navigation: {
      group: appRouteGroupIds.records,
      order: 30,
    },
  },
  {
    id: appRouteIds.rules,
    path: appRouteSegments.rules,
    href: appRoutePaths.rules,
    label: appCopy.routes.rules.label,
    description: appCopy.routes.rules.description,
    requiredPermissions: [appPermissionKeys.rulesRead],
    lazy: routeLazyLoaders.rules,
    navigation: {
      group: appRouteGroupIds.records,
      order: 40,
    },
  },
  {
    id: appRouteIds.users,
    path: appRouteSegments.users,
    href: appRoutePaths.users,
    label: appCopy.routes.users.label,
    description: appCopy.routes.users.description,
    requiredPermissions: [appPermissionKeys.usersRead],
    lazy: routeLazyLoaders.users,
    navigation: {
      group: appRouteGroupIds.utilities,
      order: 20,
    },
  },
  {
    id: appRouteIds.accessRequests,
    path: appRouteSegments.accessRequests,
    href: appRoutePaths.accessRequests,
    label: appCopy.routes.accessRequests.label,
    description: appCopy.routes.accessRequests.description,
    requiredPermissions: [appPermissionKeys.accessRequestsRead],
    lazy: routeLazyLoaders.accessRequests,
  },
  {
    id: appRouteIds.permissions,
    path: appRouteSegments.permissions,
    href: appRoutePaths.permissions,
    label: appCopy.routes.permissions.label,
    description: appCopy.routes.permissions.description,
    requiredPermissions: [appPermissionKeys.permissionsRead],
    lazy: routeLazyLoaders.permissions,
    navigation: {
      group: appRouteGroupIds.utilities,
      order: 40,
    },
  },
  {
    id: appRouteIds.audit,
    path: appRouteSegments.audit,
    href: appRoutePaths.audit,
    label: appCopy.routes.audit.label,
    description: appCopy.routes.audit.description,
    requiredPermissions: [appPermissionKeys.auditRead],
    lazy: routeLazyLoaders.audit,
    navigation: {
      group: appRouteGroupIds.monitoring,
      order: 10,
    },
  },
  {
    id: appRouteIds.notifications,
    path: appRouteSegments.notifications,
    href: appRoutePaths.notifications,
    label: appCopy.routes.notifications.label,
    description: appCopy.routes.notifications.description,
    requiredPermissions: [appPermissionKeys.notificationsRead],
    lazy: routeLazyLoaders.notifications,
    navigation: {
      group: appRouteGroupIds.monitoring,
      order: 20,
    },
  },
  {
    id: appRouteIds.profile,
    path: appRouteSegments.profile,
    href: appRoutePaths.profile,
    label: appCopy.routes.profile.label,
    description: appCopy.routes.profile.description,
    requiredPermissions: [appPermissionKeys.settingsReadSelf],
    lazy: routeLazyLoaders.profile,
    navigation: {
      group: appRouteGroupIds.utilities,
      order: 10,
    },
  },
  {
    id: appRouteIds.security,
    path: appRouteSegments.security,
    href: appRoutePaths.security,
    label: appCopy.routes.security.label,
    description: appCopy.routes.security.description,
    requiredPermissions: [appPermissionKeys.settingsReadSelf],
    lazy: routeLazyLoaders.security,
    navigation: {
      group: appRouteGroupIds.utilities,
      order: 30,
    },
  },
  {
    id: appRouteIds.clientVehicles,
    path: appRouteSegments.clientVehicles,
    label: appCopy.routes.clientVehicles.label,
    description: appCopy.routes.clientVehicles.description,
    requiredPermissions: [appPermissionKeys.clientVehiclesRead],
    lazy: routeLazyLoaders.clientVehicles,
  },
  {
    id: appRouteIds.unitUsers,
    path: appRouteSegments.unitUsers,
    label: appCopy.routes.users.label,
    description: appCopy.routes.users.description,
    requiredPermissions: [
      appPermissionKeys.unitsRead,
      appPermissionKeys.usersRead,
    ],
    lazy: routeLazyLoaders.unitUsers,
  },
] as const satisfies readonly AppRouteRegistryItem[];

export function isRouteAvailable(
  route: Pick<AppRouteRegistryItem, "id" | "availability">,
  isDevelopment = import.meta.env.DEV
) {
  return route.availability !== "development" || isDevelopment;
}

export const authenticatedRouteRegistry = registeredAuthenticatedRoutes.filter(
  (route) => isRouteAvailable(route)
);

export const navigationGroups = [
  {
    id: appRouteGroupIds.workspace,
    label: appCopy.routeGroups.workspace,
    order: 0,
  },
  {
    id: appRouteGroupIds.records,
    label: appCopy.routeGroups.records,
    order: 10,
  },
  {
    id: appRouteGroupIds.monitoring,
    label: appCopy.routeGroups.monitoring,
    order: 40,
  },
  {
    id: appRouteGroupIds.utilities,
    label: appCopy.routeGroups.utilities,
    order: 50,
  },
] as const;
