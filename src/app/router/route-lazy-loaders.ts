import type { ComponentType } from "react"

type LazyRouteModule = {
  Component: ComponentType
}

export type LazyRouteLoader = () => Promise<LazyRouteModule>

export const routeLazyLoaders = {
  home: () =>
    import("@/features/dashboard/routes/dashboard-route").then((module) => ({
      Component: module.DashboardRoute,
    })),
  login: () =>
    import("@/features/auth/routes/auth-login-route").then((module) => ({
      Component: module.AuthLoginRoute,
    })),
  recovery: () =>
    import("@/features/auth/routes/auth-recovery-route").then((module) => ({
      Component: module.AuthRecoveryRoute,
    })),
  units: () =>
    import("@/features/units/routes/units-route").then((module) => ({
      Component: module.UnitsRoute,
    })),
  unitUsers: () =>
    import("@/features/units/routes/unit-users-route").then((module) => ({
      Component: module.UnitUsersRoute,
    })),
  clients: () =>
    import("@/features/clients/routes/clients-route").then((module) => ({
      Component: module.ClientsRoute,
    })),
  clientVehicles: () =>
    import("@/features/clients/routes/client-vehicles-route").then((module) => ({
      Component: module.ClientVehiclesRoute,
    })),
  prices: () =>
    import("@/features/prices/routes/prices-route").then((module) => ({
      Component: module.PricesRoute,
    })),
  rules: () =>
    import("@/features/rules/routes/rules-route").then((module) => ({
      Component: module.RulesRoute,
    })),
  users: () =>
    import("@/features/users/routes/users-route").then((module) => ({
      Component: module.UsersRoute,
    })),
  accessRequests: () =>
    import("@/features/access-requests/routes/access-requests-route").then((module) => ({
      Component: module.AccessRequestsRedirectRoute,
    })),
  permissions: () =>
    import("@/features/permissions/routes/permissions-route").then((module) => ({
      Component: module.PermissionsRoute,
    })),
  audit: () =>
    import("@/features/audit/routes/audit-route").then((module) => ({
      Component: module.AuditRoute,
    })),
  notifications: () =>
    import("@/features/notifications/routes/notifications-route").then((module) => ({
      Component: module.NotificationsRoute,
    })),
  profile: () =>
    import("@/features/my-profile/routes/my-profile-route").then((module) => ({
      Component: module.MyProfileRoute,
    })),
  security: () =>
    import("@/features/security/routes/security-route").then((module) => ({
      Component: module.SecurityRoute,
    })),
  settingsRedirect: () =>
    import("@/features/my-profile/routes/profile-legacy-redirect-route").then((module) => ({
      Component: module.ProfileLegacyRedirectRoute,
    })),
  yard: () =>
    import("@/features/yard/routes/yard-route").then((module) => ({
      Component: module.YardRoute,
    })),
  reports: () =>
    import("@/features/reports/routes/reports-route").then((module) => ({
      Component: module.ReportsRoute,
    })),
} as const satisfies Record<string, LazyRouteLoader>
