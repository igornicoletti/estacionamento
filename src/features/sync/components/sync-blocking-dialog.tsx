import { AppEmptyState } from "@/components/shared/app-empty-state"
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

interface SyncBlockingDialogProps {
  open: boolean
  title: string
  description: string
}

function preventDismiss(event: { preventDefault: () => void }) {
  event.preventDefault()
}

export function SyncBlockingDialog({
  open,
  title,
  description,
}: SyncBlockingDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={() => undefined}>
      <AlertDialogContent
        aria-describedby={undefined}
        onEscapeKeyDown={preventDismiss}
      >
        <AppEmptyState
          aria-live="polite"
          className="rounded-lg border border-dashed p-4"
          media={<Spinner className="size-5" />}
          title={title}
          description={description}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}
