import { Navigate } from "react-router"

import { useAuthSession } from "@/features/auth/hooks"

import { getAuthProfileRole } from "./route-auth-utils"
import { getDefaultRouteHrefForRole } from "./route-home-utils"

export function DefaultRouteRedirect() {
  const { profile } = useAuthSession()
  const homeHref = getDefaultRouteHrefForRole(
    getAuthProfileRole(profile)
  )

  return <Navigate to={homeHref} replace />
}
