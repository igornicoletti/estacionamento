import { shouldBypassAuthInDev } from "@/config"

import {
  AUTH_PERMISSION_WILDCARD,
  type AuthPermission,
} from "../contracts"
import type { AuthProfile } from "../types"
import type { AuthAccessState } from "./auth-context"

function createPermissionSet(profile: AuthProfile | null) {
  return new Set<AuthPermission>(
    shouldBypassAuthInDev()
      ? [AUTH_PERMISSION_WILDCARD, ...(profile?.permissions ?? [])]
      : profile?.permissions ?? []
  )
}

export function createAuthAccessState(profile: AuthProfile | null): AuthAccessState {
  const permissionSet = createPermissionSet(profile)

  function hasPermission(permission: AuthPermission) {
    return permissionSet.has(AUTH_PERMISSION_WILDCARD) || permissionSet.has(permission)
  }

  return {
    permissions: profile?.permissions ?? [],
    hasPermission,
    hasAllPermissions(permissions) {
      return permissions.every(hasPermission)
    },
    hasAnyPermission(permissions) {
      return permissions.length === 0 || permissions.some(hasPermission)
    },
  }
}
