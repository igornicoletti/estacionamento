import { Outlet, type RouteObject } from "react-router"

import {
  RouteErrorBoundary,
  RouteNotFound,
  RouteLoadingState,
} from "./components"
import {
  createAuthenticatedRoute,
  createAuthenticatedShellRoute,
  createPublicRoute,
  createPublicShellRoute,
} from "./route-builders"
import {
  appRouteIds,
  authenticatedRouteRegistry,
  publicRouteRegistry,
} from "./route-registry"

export const routes = [
  {
    id: appRouteIds.root,
    element: <Outlet />,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <RouteLoadingState scope="app" />,
    children: [
      createPublicShellRoute(publicRouteRegistry.map(createPublicRoute)),
      createAuthenticatedShellRoute(
        authenticatedRouteRegistry.map(createAuthenticatedRoute)
      ),
      {
        id: appRouteIds.notFound,
        path: "*",
        element: <RouteNotFound />,
        errorElement: <RouteErrorBoundary />,
        hydrateFallbackElement: <RouteLoadingState scope="page" />,
      },
    ],
  },
] satisfies RouteObject[]
