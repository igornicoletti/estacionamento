import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

import { unitsCopy } from "../constants/units-copy"

interface UnitSyncBlockingDialogProps {
  open: boolean
  title?: string
  description?: string
}

function preventDismiss(event: { preventDefault: () => void }) {
  event.preventDefault()
}

export function UnitSyncBlockingDialog({
  open,
  title = unitsCopy.sync.runningTitle,
  description = unitsCopy.sync.runningDescription,
}: UnitSyncBlockingDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={() => undefined}>
      <AlertDialogContent
        aria-describedby={undefined}
        onEscapeKeyDown={preventDismiss}
      >
        <AppEmptyState
          aria-live="assertive"
          media={<Spinner className="size-5" />}
          title={title}
          description={description}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}
