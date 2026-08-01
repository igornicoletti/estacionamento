import { usersCopy } from "../constants/users-copy"
import { interpolateUserCopy } from "./users-models"
import { type UserAdminAction } from "./users-types"

export interface UserAdminActionPresentation {
  actionLabel: string
  description: string
  error: string
  loading: string
  pendingLabel: string
  success: string
  title: string
  tone: "default" | "destructive" | "warning"
}

function withTarget(template: string, action: UserAdminAction) {
  return interpolateUserCopy(template, {
    name: action.user.name || usersCopy.dialogs.targetFallback,
  })
}

export function getUserAdminActionPresentation(
  action: UserAdminAction
): UserAdminActionPresentation {
  switch (action.kind) {
    case "block":
      return {
        actionLabel: usersCopy.dialogs.blockConfirm,
        description: withTarget(usersCopy.dialogs.blockDescription, action),
        error: usersCopy.feedback.block.error,
        loading: usersCopy.feedback.block.loading,
        pendingLabel: usersCopy.feedback.block.loading,
        success: usersCopy.feedback.block.success,
        title: usersCopy.dialogs.blockTitle,
        tone: "destructive",
      }
    case "clear-lock": {
      const isInactive = action.user.status === "inactive"

      return {
        actionLabel: isInactive
          ? usersCopy.dialogs.unblockConfirm
          : usersCopy.dialogs.clearLockConfirm,
        description: withTarget(
          isInactive
            ? usersCopy.dialogs.unblockDescription
            : usersCopy.dialogs.clearLockDescription,
          action
        ),
        error: usersCopy.feedback.clearLock.error,
        loading: usersCopy.feedback.clearLock.loading,
        pendingLabel: usersCopy.feedback.clearLock.loading,
        success: usersCopy.feedback.clearLock.success,
        title: isInactive
          ? usersCopy.dialogs.unblockTitle
          : usersCopy.dialogs.clearLockTitle,
        tone: "default",
      }
    }
    case "reset-passkey":
      return {
        actionLabel: usersCopy.dialogs.resetPasskeyConfirm,
        description: withTarget(
          usersCopy.dialogs.resetPasskeyDescription,
          action
        ),
        error: usersCopy.feedback.resetPasskey.error,
        loading: usersCopy.feedback.resetPasskey.loading,
        pendingLabel: usersCopy.feedback.resetPasskey.loading,
        success: usersCopy.feedback.resetPasskey.success,
        title: usersCopy.dialogs.resetPasskeyTitle,
        tone: "warning",
      }
    case "reset-password":
      return {
        actionLabel: usersCopy.dialogs.resetConfirm,
        description: withTarget(usersCopy.dialogs.resetDescription, action),
        error: usersCopy.feedback.reset.error,
        loading: usersCopy.feedback.reset.loading,
        pendingLabel: usersCopy.feedback.reset.loading,
        success: usersCopy.feedback.reset.success,
        title: usersCopy.dialogs.resetTitle,
        tone: "warning",
      }
    case "revoke-sessions":
      return {
        actionLabel: usersCopy.dialogs.revokeSessionsConfirm,
        description: withTarget(
          usersCopy.dialogs.revokeSessionsDescription,
          action
        ),
        error: usersCopy.feedback.revokeSessions.error,
        loading: usersCopy.feedback.revokeSessions.loading,
        pendingLabel: usersCopy.feedback.revokeSessions.loading,
        success: usersCopy.feedback.revokeSessions.success,
        title: usersCopy.dialogs.revokeSessionsTitle,
        tone: "warning",
      }
  }
}
