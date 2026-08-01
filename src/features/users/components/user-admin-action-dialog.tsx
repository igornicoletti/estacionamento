import { AppAlertDialog } from "@/components/shared/app-alert-dialog"

import { getUserAdminActionPresentation } from "../model/users-admin-actions"
import { type UserAdminAction } from "../model/users-types"

interface UserAdminActionDialogProps {
  action: UserAdminAction | null
  isPending: boolean
  onConfirm: (action: UserAdminAction) => Promise<void>
  onOpenChange: (open: boolean) => void
}

export function UserAdminActionDialog({
  action,
  isPending,
  onConfirm,
  onOpenChange,
}: UserAdminActionDialogProps) {
  const presentation = action
    ? getUserAdminActionPresentation(action)
    : null

  return (
    <AppAlertDialog
      size="sm"
      tone={presentation?.tone}
      open={Boolean(action)}
      onOpenChange={onOpenChange}
      title={presentation?.title}
      description={presentation?.description}
      actionLabel={presentation?.actionLabel}
      pendingLabel={presentation?.pendingLabel}
      isPending={isPending}
      onAction={async () => {
        if (action) {
          await onConfirm(action)
        }
      }}
    />
  )
}
