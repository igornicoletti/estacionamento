import type { ComponentType } from "react"

import { appCopy } from "@/app/app-copy"
import { AUTH_PERMISSION, type AuthPermission } from "@/features/auth"

export const appRouteIds = {
  root: "root",
  auth: "auth",
  login: "auth.login",
  recovery: "auth.recovery",
  app: "app",
  home: "app.home",
  units: "app.units",
  clients: "app.clients",
  clientVehicles: "app.clientVehicles",
  prices: "app.prices",
  rules: "app.rules",
  users: "app.users",
  accessRequests: "app.accessRequests",
  permissions: "app.permissions",
  audit: "app.audit",
  notifications: "app.notifications",
  settings: "app.settings",
  settingsProfileAlias: "app.settings.profileAlias",
  unitUsers: "app.unitUsers",
  notFound: "not-found",
} as const

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
  settings: "/configuracoes",
  profile: "/perfil",
} as const satisfies Record<string, `/${string}`>

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
  settings: "configuracoes",
  profile: "perfil",
} as const

export const appRouteGroupIds = {
  workspace: "workspace",
  records: "records",
  commercial: "commercial",
  access: "access",
  monitoring: "monitoring",
  utilities: "utilities",
} as const

export const appPermissionKeys = AUTH_PERMISSION


export type AppRouteId = (typeof appRouteIds)[keyof typeof appRouteIds]
export type AppRoutePath = (typeof appRoutePaths)[keyof typeof appRoutePaths]
export type AppRouteGroupId =
  (typeof appRouteGroupIds)[keyof typeof appRouteGroupIds]

type LazyRouteLoader = () => Promise<{ Component: ComponentType }>

export interface AppRouteRegistryItem {
  id: AppRouteId
  path?: string
  href?: AppRoutePath
  index?: boolean
  label: string
  description: string
  requiredPermissions?: readonly AuthPermission[]
  lazy?: LazyRouteLoader
  navigation?: {
    group: AppRouteGroupId
    order: number
  }
}

export const publicRouteRegistry = [
  {
    id: appRouteIds.login,
    path: appRouteSegments.login,
    href: appRoutePaths.login,
    label: appCopy.routes.login.label,
    description: appCopy.routes.login.description,
    lazy: () =>
      import("@/features/auth/routes/auth-login-route").then((module) => ({
        Component: module.AuthLoginRoute,
      })),
  },
  {
    id: appRouteIds.recovery,
    path: appRouteSegments.recovery,
    href: appRoutePaths.recovery,
    label: appCopy.routes.recovery.label,
    description: appCopy.routes.recovery.description,
    lazy: () =>
      import("@/features/auth/routes/auth-recovery-route").then((module) => ({
        Component: module.AuthRecoveryRoute,
      })),
  },
] as const satisfies readonly AppRouteRegistryItem[]

export const authenticatedRouteRegistry = [
  {
    id: appRouteIds.home,
    index: true,
    href: appRoutePaths.home,
    label: appCopy.routes.home.label,
    description: appCopy.routes.home.description,
    navigation: {
      group: appRouteGroupIds.workspace,
      order: 0,
    },
  },
  {
    id: appRouteIds.units,
    path: appRouteSegments.units,
    href: appRoutePaths.units,
    label: appCopy.routes.units.label,
    description: appCopy.routes.units.description,
    requiredPermissions: [appPermissionKeys.unitsRead],
    lazy: () =>
      import("@/features/units").then((module) => ({
        Component: module.UnitsRoute,
      })),
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
    lazy: () =>
      import("@/features/clients").then((module) => ({
        Component: module.ClientsRoute,
      })),
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
    lazy: () =>
      import("@/features/prices").then((module) => ({
        Component: module.PricesRoute,
      })),
    navigation: {
      group: appRouteGroupIds.commercial,
      order: 10,
    },
  },
  {
    id: appRouteIds.rules,
    path: appRouteSegments.rules,
    href: appRoutePaths.rules,
    label: appCopy.routes.rules.label,
    description: appCopy.routes.rules.description,
    requiredPermissions: [appPermissionKeys.rulesRead],
    lazy: () =>
      import("@/features/rules").then((module) => ({
        Component: module.RulesRoute,
      })),
    navigation: {
      group: appRouteGroupIds.commercial,
      order: 20,
    },
  },
  {
    id: appRouteIds.users,
    path: appRouteSegments.users,
    href: appRoutePaths.users,
    label: appCopy.routes.users.label,
    description: appCopy.routes.users.description,
    requiredPermissions: [appPermissionKeys.usersRead],
    lazy: () =>
      import("@/features/users").then((module) => ({
        Component: module.UsersRoute,
      })),
    navigation: {
      group: appRouteGroupIds.access,
      order: 10,
    },
  },
  {
    id: appRouteIds.accessRequests,
    path: appRouteSegments.accessRequests,
    href: appRoutePaths.accessRequests,
    label: appCopy.routes.accessRequests.label,
    description: appCopy.routes.accessRequests.description,
    requiredPermissions: [appPermissionKeys.accessRequestsRead],
    lazy: () =>
      import("@/features/access-requests").then((module) => ({
        Component: module.AccessRequestsRoute,
      })),
    navigation: {
      group: appRouteGroupIds.access,
      order: 20,
    },
  },
  {
    id: appRouteIds.permissions,
    path: appRouteSegments.permissions,
    href: appRoutePaths.permissions,
    label: appCopy.routes.permissions.label,
    description: appCopy.routes.permissions.description,
    requiredPermissions: [appPermissionKeys.permissionsRead],
    lazy: () =>
      import("@/features/permissions").then((module) => ({
        Component: module.PermissionsRoute,
      })),
    navigation: {
      group: appRouteGroupIds.access,
      order: 30,
    },
  },
  {
    id: appRouteIds.audit,
    path: appRouteSegments.audit,
    href: appRoutePaths.audit,
    label: appCopy.routes.audit.label,
    description: appCopy.routes.audit.description,
    requiredPermissions: [appPermissionKeys.auditRead],
    lazy: () =>
      import("@/features/audit").then((module) => ({
        Component: module.AuditRoute,
      })),
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
    lazy: () =>
      import("@/features/notifications/routes/notifications-route").then((module) => ({
        Component: module.NotificationsRoute,
      })),
    navigation: {
      group: appRouteGroupIds.monitoring,
      order: 20,
    },
  },
  {
    id: appRouteIds.settings,
    path: appRouteSegments.settings,
    href: appRoutePaths.settings,
    label: appCopy.routes.settings.label,
    description: appCopy.routes.settings.description,
    requiredPermissions: [appPermissionKeys.settingsReadSelf],
    lazy: () =>
      import("@/features/settings").then((module) => ({
        Component: module.SettingsRoute,
      })),
    navigation: {
      group: appRouteGroupIds.utilities,
      order: 10,
    },
  },
  {
    id: appRouteIds.clientVehicles,
    path: appRouteSegments.clientVehicles,
    label: appCopy.routes.clientVehicles.label,
    description: appCopy.routes.clientVehicles.description,
    requiredPermissions: [appPermissionKeys.clientVehiclesRead],
    lazy: () =>
      import("@/features/clients").then((module) => ({
        Component: module.ClientVehiclesRoute,
      })),
  },
  {
    id: appRouteIds.unitUsers,
    path: appRouteSegments.unitUsers,
    label: appCopy.routes.users.label,
    description: appCopy.routes.users.description,
    requiredPermissions: [appPermissionKeys.unitsRead, appPermissionKeys.usersRead],
    lazy: () =>
      import("@/features/units").then((module) => ({
        Component: module.UnitUsersRoute,
      })),
  },
  {
    id: appRouteIds.settingsProfileAlias,
    path: appRouteSegments.profile,
    href: appRoutePaths.profile,
    label: appCopy.routes.settings.label,
    description: appCopy.routes.settings.description,
    requiredPermissions: [appPermissionKeys.settingsReadSelf],
    lazy: () =>
      import("@/features/settings").then((module) => ({
        Component: module.SettingsRoute,
      })),
  },
] as const satisfies readonly AppRouteRegistryItem[]

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
    id: appRouteGroupIds.commercial,
    label: appCopy.routeGroups.commercial,
    order: 20,
  },
  {
    id: appRouteGroupIds.access,
    label: appCopy.routeGroups.access,
    order: 30,
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
] as const
