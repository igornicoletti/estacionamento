import { Outlet, type RouteObject } from "react-router"

import { AuthenticatedLayout } from "@/app/layouts/authenticated-layout"
import {
  AuthenticatedHomeRoute,
  PrivateRouteGate,
  PublicRouteGate,
  RouteLoadingState,
  RouteNotFound,
} from "@/app/router/route-elements"
import { RouteErrorBoundary } from "@/app/router/route-error-boundary"
import {
  appRouteIds, authenticatedRouteRegistry,
  publicRouteRegistry,
  type AppRouteRegistryItem
} from "@/app/router/route-registry"

const routeHydrateFallbackElement = <RouteLoadingState />

function createPublicRoute(route: AppRouteRegistryItem): RouteObject {
  return {
    id: route.id,
    path: route.path,
    lazy: route.lazy,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeHydrateFallbackElement,
  }
}

function createAuthenticatedRouteLeaf(route: AppRouteRegistryItem): RouteObject {
  if (route.index) {
    return {
      id: route.id,
      index: true,
      Component: AuthenticatedHomeRoute,
      errorElement: <RouteErrorBoundary />,
      hydrateFallbackElement: routeHydrateFallbackElement,
    }
  }

  return {
    id: route.id,
    path: route.path,
    lazy: route.lazy,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeHydrateFallbackElement,
  }
}

function createAuthenticatedRoute(route: AppRouteRegistryItem): RouteObject {
  const leaf = createAuthenticatedRouteLeaf(route)

  if (!route.requiredPermissions || route.requiredPermissions.length === 0) {
    return leaf
  }

  return {
    id: `${route.id}.permissions`,
    element: <PrivateRouteGate requiredPermissions={route.requiredPermissions} />,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeHydrateFallbackElement,
    children: [leaf],
  }
}

export const routes = [
  {
    id: appRouteIds.root,
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: routeHydrateFallbackElement,
    children: [
      {
        id: appRouteIds.auth,
        element: <PublicRouteGate />,
        errorElement: <RouteErrorBoundary />,
        hydrateFallbackElement: routeHydrateFallbackElement,
        children: publicRouteRegistry.map(createPublicRoute),
      },
      {
        id: appRouteIds.app,
        element: (
          <PrivateRouteGate>
            <AuthenticatedLayout />
          </PrivateRouteGate>
        ),
        errorElement: <RouteErrorBoundary />,
        hydrateFallbackElement: routeHydrateFallbackElement,
        children: authenticatedRouteRegistry.map(createAuthenticatedRoute),
      },
      {
        id: appRouteIds.notFound,
        path: "*",
        Component: RouteNotFound,
        errorElement: <RouteErrorBoundary />,
        hydrateFallbackElement: routeHydrateFallbackElement,
      },
    ],
  },
] satisfies RouteObject[]
