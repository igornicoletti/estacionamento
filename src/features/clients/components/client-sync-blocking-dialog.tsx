import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

import { clientsCopy } from "../constants/clients-copy"

interface ClientSyncBlockingDialogProps {
  open: boolean
  title?: string
  description?: string
}

function preventDismiss(event: { preventDefault: () => void }) {
  event.preventDefault()
}

export function ClientSyncBlockingDialog({
  open,
  title = clientsCopy.sync.runningTitle,
  description = clientsCopy.sync.runningDescription,
}: ClientSyncBlockingDialogProps) {
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
