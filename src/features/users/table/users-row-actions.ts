import { type DataTableRowAction } from "@/components/data-table"

import { usersCopy } from "../constants/users-copy"
import { type UserRecord } from "../model/users-types"

export interface UsersTableActionOptions {
  canManageUser?: (user: UserRecord) => boolean
  onBlockUser?: (user: UserRecord) => void
  onClearLock?: (user: UserRecord) => void
  onEditUser?: (user: UserRecord) => void
  onResetAccess?: (user: UserRecord) => void
  onResetPasskey?: (user: UserRecord) => void
  onRevokeSessions?: (user: UserRecord) => void
  onViewUserDetails?: (user: UserRecord) => void
}

export function createUserRowActions(
  user: UserRecord,
  options: UsersTableActionOptions
): DataTableRowAction<UserRecord>[] {
  const canManage = options.canManageUser?.(user) ?? false
  const isActive = user.status === "active"
  const isInactive = user.status === "inactive"
  const lockedUntil = user.lockedUntil
    ? new Date(user.lockedUntil).getTime()
    : Number.NaN
  const isTemporarilyLocked =
    Number.isFinite(lockedUntil) && lockedUntil > Date.now()

  return [
    ...(options.onViewUserDetails
      ? [
          {
            id: "details" as const,
            label: usersCopy.actions.details,
            onSelect: () => options.onViewUserDetails?.(user),
          },
        ]
      : []),
    ...(canManage && options.onEditUser
      ? [
          {
            id: "edit" as const,
            label: usersCopy.actions.edit,
            onSelect: () => options.onEditUser?.(user),
          },
        ]
      : []),
    ...(canManage && options.onResetAccess
      ? [
          {
            id: "reset-access" as const,
            label: usersCopy.actions.resetPassword,
            onSelect: () => options.onResetAccess?.(user),
          },
        ]
      : []),
    ...(canManage &&
    options.onResetPasskey &&
    user.passkeyStatus === "active"
      ? [
          {
            id: "reset-passkey" as const,
            label: usersCopy.actions.resetPasskey,
            onSelect: () => options.onResetPasskey?.(user),
          },
        ]
      : []),
    ...(canManage &&
    options.onClearLock &&
    (isInactive || isTemporarilyLocked)
      ? [
          {
            id: "clear-lock" as const,
            label: isInactive
              ? usersCopy.actions.unblockUser
              : usersCopy.actions.clearLock,
            onSelect: () => options.onClearLock?.(user),
          },
        ]
      : []),
    ...(canManage && options.onRevokeSessions
      ? [
          {
            id: "revoke-sessions" as const,
            label: usersCopy.actions.revokeSessions,
            onSelect: () => options.onRevokeSessions?.(user),
          },
        ]
      : []),
    ...(canManage && isActive && options.onBlockUser
      ? [
          {
            id: "block" as const,
            label: usersCopy.actions.blockUser,
            onSelect: () => options.onBlockUser?.(user),
            separatorBefore: true,
            variant: "destructive" as const,
          },
        ]
      : []),
  ]
}
