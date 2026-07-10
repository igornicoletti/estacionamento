import { Outlet, type RouteObject } from "react-router"

import { AuthenticatedLayout } from "@/app/layouts/authenticated-layout"
import { appRouteIds } from "@/app/router/route-registry"
import {
  AuthenticatedHomeRoute,
  PrivateRouteGate,
  PublicRouteGate,
  RouteNotFound,
} from "@/app/router/route-elements"
import {
  authenticatedRouteRegistry,
  publicRouteRegistry,
  type AppRouteRegistryItem,
} from "@/app/router/route-registry"
import { RouteErrorBoundary } from "@/app/router/route-error-boundary"

function createPublicRoute(route: AppRouteRegistryItem): RouteObject {
  return {
    id: route.id,
    path: route.path,
    lazy: route.lazy,
    errorElement: <RouteErrorBoundary />,
  }
}

function createAuthenticatedRouteLeaf(route: AppRouteRegistryItem): RouteObject {
  if (route.index) {
    return {
      id: route.id,
      index: true,
      Component: AuthenticatedHomeRoute,
      errorElement: <RouteErrorBoundary />,
    }
  }

  return {
    id: route.id,
    path: route.path,
    lazy: route.lazy,
    errorElement: <RouteErrorBoundary />,
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
    children: [leaf],
  }
}

export const routes = [
  {
    id: appRouteIds.root,
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        id: appRouteIds.auth,
        element: <PublicRouteGate />,
        errorElement: <RouteErrorBoundary />,
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
        children: authenticatedRouteRegistry.map(createAuthenticatedRoute),
      },
      {
        id: appRouteIds.notFound,
        path: "*",
        Component: RouteNotFound,
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },
] satisfies RouteObject[]
