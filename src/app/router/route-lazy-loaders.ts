import type { ComponentType } from "react"

type LazyRouteModule = {
  Component: ComponentType
}

export type LazyRouteLoader = () => Promise<LazyRouteModule>

export const routeLazyLoaders = {
  login: () =>
    import("@/features/auth/routes/auth-login-route").then((module) => ({
      Component: module.AuthLoginRoute,
    })),
  recovery: () =>
    import("@/features/auth/routes/auth-recovery-route").then((module) => ({
      Component: module.AuthRecoveryRoute,
    })),
  units: () =>
    import("@/features/units").then((module) => ({
      Component: module.UnitsRoute,
    })),
  unitUsers: () =>
    import("@/features/units").then((module) => ({
      Component: module.UnitUsersRoute,
    })),
  clients: () =>
    import("@/features/clients").then((module) => ({
      Component: module.ClientsRoute,
    })),
  clientVehicles: () =>
    import("@/features/clients").then((module) => ({
      Component: module.ClientVehiclesRoute,
    })),
  prices: () =>
    import("@/features/prices").then((module) => ({
      Component: module.PricesRoute,
    })),
  rules: () =>
    import("@/features/rules").then((module) => ({
      Component: module.RulesRoute,
    })),
  users: () =>
    import("@/features/users").then((module) => ({
      Component: module.UsersRoute,
    })),
  accessRequests: () =>
    import("@/features/access-requests").then((module) => ({
      Component: module.AccessRequestsRedirectRoute,
    })),
  permissions: () =>
    import("@/features/permissions").then((module) => ({
      Component: module.PermissionsRoute,
    })),
  audit: () =>
    import("@/features/audit").then((module) => ({
      Component: module.AuditRoute,
    })),
  notifications: () =>
    import("@/features/notifications/routes/notifications-route").then((module) => ({
      Component: module.NotificationsRoute,
    })),
  settings: () =>
    import("@/features/settings").then((module) => ({
      Component: module.SettingsRoute,
    })),
  yard: () =>
    import("@/features/yard/routes/yard-route").then((module) => ({
      Component: module.YardRoute,
    })),
} as const satisfies Record<string, LazyRouteLoader>
