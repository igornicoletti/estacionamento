import { Navigate } from "react-router"

import { useAuthSession } from "@/features/auth/hooks"

import { RouteAccessDenied } from "./route-access-denied"
import { getAuthProfileRole } from "./route-auth-utils"
import { getDefaultRouteHrefForRole } from "./route-home-utils"

export function DefaultRouteRedirect() {
  const { profile } = useAuthSession()
  const homeHref = getDefaultRouteHrefForRole(getAuthProfileRole(profile))

  if (!homeHref) {
    return <RouteAccessDenied />
  }

  return <Navigate to={homeHref} replace />
}
