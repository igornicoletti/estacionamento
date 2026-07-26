import { RouterProvider, createBrowserRouter } from "react-router"

import {
  createRouteErrorId,
  reportRouteError,
} from "./route-error-reporter"
import { routes } from "./routes"

const router = createBrowserRouter(routes)

export function AppRouter() {
  return (
    <RouterProvider
      router={router}
      onError={(error) => {
        reportRouteError({
          errorId: createRouteErrorId(),
          error,
          source: "router-provider",
        })
      }}
    />
  )
}
