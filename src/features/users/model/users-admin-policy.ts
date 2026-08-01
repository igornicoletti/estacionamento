import { AUTH_ROLE_KEY } from "@/features/auth"

import {
  userRoleValues,
  type UserRecord,
  type UserRole,
} from "./users-types"

export function getAssignableUserRoles(
  actorRole: UserRole | null
): readonly UserRole[] {
  if (actorRole === AUTH_ROLE_KEY.owner) {
    return userRoleValues
  }

  if (actorRole === AUTH_ROLE_KEY.admin) {
    return userRoleValues.filter((role) => role !== AUTH_ROLE_KEY.owner)
  }

  return []
}

export function canManageUserTarget(
  actor: {
    authUserId: string | null | undefined
    role: UserRole | null
  },
  target: UserRecord
) {
  if (
    !actor.authUserId ||
    !target.authUserId ||
    actor.authUserId === target.authUserId
  ) {
    return false
  }

  if (actor.role === AUTH_ROLE_KEY.owner) {
    return true
  }

  return (
    actor.role === AUTH_ROLE_KEY.admin &&
    target.role !== AUTH_ROLE_KEY.owner
  )
}
