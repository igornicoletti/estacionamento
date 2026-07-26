import type { RouteObject } from "react-router"

import { AuthenticatedLayout } from "@/app/layouts"
import { AuthenticatedAppProviders } from "@/app/providers"

import {
  PrivateRouteGate,
  PublicRouteGate,
  RouteErrorBoundary,
  RouteLoadingState,
} from "./components"
import {
  appRouteIds,
  type AppRouteRegistryItem,
} from "./route-registry"

const routeHydrateFallbackElement = <RouteLoadingState scope="route" />

function getRouteHandle(route: AppRouteRegistryItem) {
  return {
    label: route.label,
    description: route.description,
    access: {
      requiredPermissions: route.requiredPermissions ?? [],
    },
  }
}

export function createPublicRoute(route: AppRouteRegistryItem): RouteObject {
  return {
    id: route.id,
    path: route.path,
    lazy: route.lazy,
    handle: getRouteHandle(route),
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeHydrateFallbackElement,
  }
}

export function createAuthenticatedRouteLeaf(
  route: AppRouteRegistryItem
): RouteObject {
  return {
    id: route.id,
    index: route.index,
    path: route.path,
    lazy: route.lazy,
    handle: getRouteHandle(route),
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeHydrateFallbackElement,
  }
}

export function createAuthenticatedRoute(
  route: AppRouteRegistryItem
): RouteObject {
  const leaf = createAuthenticatedRouteLeaf(route)

  if (!route.requiredPermissions || route.requiredPermissions.length === 0) {
    return leaf
  }

  return {
    id: `${route.id}.permissions`,
    element: (
      <PrivateRouteGate requiredPermissions={route.requiredPermissions} />
    ),
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeHydrateFallbackElement,
    children: [leaf],
  }
}

export function createAuthenticatedShellRoute(
  children: RouteObject[]
): RouteObject {
  return {
    id: appRouteIds.app,
    element: (
      <PrivateRouteGate>
        <AuthenticatedAppProviders>
          <AuthenticatedLayout />
        </AuthenticatedAppProviders>
      </PrivateRouteGate>
    ),
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <RouteLoadingState scope="app" />,
    children,
  }
}

export function createPublicShellRoute(children: RouteObject[]): RouteObject {
  return {
    id: appRouteIds.auth,
    element: <PublicRouteGate />,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <RouteLoadingState scope="page" />,
    children,
  }
}
