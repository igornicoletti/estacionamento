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
        className="max-w-sm rounded-xl p-0"
      >
        <AppEmptyState
          aria-live="polite"
          className="min-h-48 p-6 text-center"
          media={<Spinner className="size-5" />}
          title={title}
          description={description}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}
