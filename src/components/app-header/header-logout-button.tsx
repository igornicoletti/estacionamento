
import { LogOutIcon } from "lucide-react"

import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { SignOutConfirmationCopy } from "@/components/user-menu"

export type HeaderLogoutButtonProps = {
  copy: SignOutConfirmationCopy
  onSignOut: () => Promise<void>
  className?: string
}

export function HeaderLogoutButton({
  copy,
  onSignOut,
  className,
}: HeaderLogoutButtonProps) {
  return (
    <AppAlertDialog
      size="sm"
      tone="destructive"
      title={copy.title}
      description={copy.description}
      actionLabel={copy.actionLabel}
      pendingLabel={copy.pendingLabel}
      onAction={onSignOut}
      trigger={
        <Button
          type="button"
          variant="destructive"
          className={cn("hidden lg:inline-flex", className)}
        >
          <LogOutIcon data-icon="inline-start" aria-hidden="true" />
          {copy.actionLabel}
        </Button>
      }
    />
  )
}
