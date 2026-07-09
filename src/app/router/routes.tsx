import type { ComponentType } from "react"
import { Outlet, type RouteObject } from "react-router"

import { AppShell, AuthShell } from "@/app/layouts"
import type { AuthCapability } from "@/features/auth"

import { AuthRoute } from "./auth-route"
import { DefaultRouteRedirect } from "./default-route-redirect"
import { ProtectedRoute } from "./protected-route"
import {
  authRouteDefinitions,
  protectedRouteDefinitions,
  type AuthRouteDefinition,
  type RouteModuleDefinition,
} from "./route-definitions"
import { RouteErrorBoundary } from "./route-error-boundary"

type LazyRouteModule = Promise<{
  Component: ComponentType
  ErrorBoundary?: typeof RouteErrorBoundary
}>

function createProtectedRouteComponent(
  Component: ComponentType,
  requiredCapabilities: readonly AuthCapability[],
) {
  return function ProtectedRouteComponent() {
    return (
      <ProtectedRoute requiredCapabilities={requiredCapabilities}>
        <Component />
      </ProtectedRoute>
    )
  }
}

function createProtectedRoute(route: RouteModuleDefinition): RouteObject {
  return {
    id: route.id,
    path: route.path,
    lazy: async (): LazyRouteModule => {
      const { default: Component } = await route.load()

      return {
        Component: createProtectedRouteComponent(
          Component,
          route.requiredCapabilities,
        ),
        ErrorBoundary: RouteErrorBoundary,
      }
    },
  }
}

function createAuthRoute(route: AuthRouteDefinition): RouteObject {
  return {
    id: route.id,
    path: route.path,
    lazy: async () => {
      const { default: Component } = await route.load()

      return { Component }
    },
  }
}

const appRoutes = protectedRouteDefinitions.map(createProtectedRoute)
const authRoutes = authRouteDefinitions.map(createAuthRoute)

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
            children: authRoutes,
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
          ...appRoutes,
        ],
      },
      {
        id: "not-found",
        path: "*",
        lazy: async () => {
          const { NotFoundRoute } = await import("@/app/router/not-found-route")

          return {
            Component: NotFoundRoute,
            ErrorBoundary: RouteErrorBoundary,
          }
        },
      },
    ],
  },
] satisfies RouteObject[]
