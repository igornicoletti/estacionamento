import type { Location } from "react-router"

import { shouldBypassAuthInDev } from "@/config"
import {
  canAccessProtectedApp,
  type AuthContextValue,
  type AuthPermission,
} from "@/features/auth"

interface ResolvePrivateRouteAccessInput {
  auth: AuthContextValue
  requiredPermissions?: readonly AuthPermission[]
}

export function canBypassRouteAccessInDev() {
  return import.meta.env.DEV && shouldBypassAuthInDev()
}

export function canRenderPrivateRoute({
  auth,
  requiredPermissions = [],
}: ResolvePrivateRouteAccessInput) {
  if (canBypassRouteAccessInDev()) {
    return true
  }

  if (!auth.isAuthenticated || !canAccessProtectedApp(auth.profile?.status)) {
    return false
  }

  return auth.access.hasAllPermissions(requiredPermissions)
}

export function getLoginRedirectState(location: Location) {
  return { from: location }
}
