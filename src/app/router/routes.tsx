import * as React from "react"
import {
  Outlet,
  type RouteObject,
} from "react-router"

import { AppShell, AuthShell } from "@/app/layouts"
import {
  routeCapabilities,
  type AuthCapability,
} from "@/features/auth"

import { AuthRoute } from "./auth-route"
import { DefaultRouteRedirect } from "./default-route-redirect"
import { ProtectedRoute } from "./protected-route"
import { PublicRoute } from "./public-route"
import { lazyAppRouteDefinitions } from "./route-definitions"
import { RouteErrorBoundary } from "./route-error-boundary"
import { RouteLoading } from "./route-loading"

const NotFoundRoute = React.lazy(() =>
  import("@/app/router/not-found-route").then((module) => ({
    default: module.NotFoundRoute,
  }))
)

const AuthLoginRoute = React.lazy(() =>
  import("@/features/auth/routes/auth-login-route").then((module) => ({
    default: module.AuthLoginRoute,
  }))
)

const AuthRecoveryRoute = React.lazy(() =>
  import("@/features/auth/routes/auth-recovery-route").then((module) => ({
    default: module.AuthRecoveryRoute,
  }))
)

const ClientVehiclesRoute = React.lazy(() =>
  import("@/features/clients").then((module) => ({
    default: module.ClientVehiclesRoute,
  }))
)

const UnitUsersRoute = React.lazy(() =>
  import("@/features/units").then((module) => ({
    default: module.UnitUsersRoute,
  }))
)

const NotificationsRoute = React.lazy(() =>
  import("@/features/notifications").then((module) => ({
    default: module.NotificationsRoute,
  }))
)

const SettingsRoute = React.lazy(() =>
  import("@/features/settings").then((module) => ({
    default: module.SettingsRoute,
  }))
)

type RouteLoadingVariant = React.ComponentProps<typeof RouteLoading>["variant"]

function withRouteSuspense(
  element: React.ReactNode,
  variant: RouteLoadingVariant = "screen"
) {
  return (
    <React.Suspense fallback={<RouteLoading variant={variant} />}>
      {element}
    </React.Suspense>
  )
}

function withProtectedRouteBoundary(
  element: React.ReactNode,
  requiredCapabilities: readonly AuthCapability[] = []
) {
  return (
    <ProtectedRoute requiredCapabilities={requiredCapabilities}>
      {withRouteSuspense(element, "section")}
    </ProtectedRoute>
  )
}

function withPublicRouteBoundary(element: React.ReactNode) {
  return withRouteSuspense(element, "screen")
}

const appRoutes = lazyAppRouteDefinitions.map((route) => {
  const RouteComponent = React.lazy(route.load)

  return {
    id: route.id,
    path: route.path,
    element: withProtectedRouteBoundary(
      <RouteComponent />,
      route.requiredCapabilities
    ),
    errorElement: <RouteErrorBoundary />,
  } satisfies RouteObject
})

export const routes = [
  {
    id: "root",
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        id: "auth",
        element: <AuthShell />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            id: "auth-guard",
            element: <AuthRoute />,
            children: [
              {
                id: "login",
                path: "login",
                element: withPublicRouteBoundary(<AuthLoginRoute />),
              },
              {
                id: "access-recovery",
                path: "recuperar-acesso",
                element: withPublicRouteBoundary(<AuthRecoveryRoute />),
              },
            ],
          },
        ],
      },
      {
        id: "app",
        element: (
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            index: true,
            element: <DefaultRouteRedirect />,
          },
          {
            id: "client-vehicles",
            path: "clientes/:cod_pessoa",
            element: withProtectedRouteBoundary(
              <ClientVehiclesRoute />,
              routeCapabilities.clientVehicles
            ),
            errorElement: <RouteErrorBoundary />,
          },
          {
            id: "unit-users",
            path: "unidades/:cod_empresa/usuarios",
            element: withProtectedRouteBoundary(<UnitUsersRoute />, [
              ...routeCapabilities.units,
              ...routeCapabilities.users,
            ]),
            errorElement: <RouteErrorBoundary />,
          },
          {
            id: "notifications",
            path: "notificacoes",
            element: withProtectedRouteBoundary(
              <NotificationsRoute />,
              routeCapabilities.notifications
            ),
            errorElement: <RouteErrorBoundary />,
          },
          {
            id: "settings",
            path: "configuracoes",
            element: withProtectedRouteBoundary(
              <SettingsRoute />,
              routeCapabilities.settings
            ),
            errorElement: <RouteErrorBoundary />,
          },
          {
            id: "settings-profile-alias",
            path: "perfil",
            element: withProtectedRouteBoundary(
              <SettingsRoute />,
              routeCapabilities.settings
            ),
            errorElement: <RouteErrorBoundary />,
          },
          ...appRoutes,
        ],
      },
      {
        id: "not-found",
        path: "*",
        element: (
          <PublicRoute>
            {withPublicRouteBoundary(<NotFoundRoute />)}
          </PublicRoute>
        ),
      },
    ],
  },
] satisfies RouteObject[]
