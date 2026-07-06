import { Loader2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export type ManualSyncDialogPhase = "confirm" | "running"

interface ManualSyncDialogProps {
  open: boolean
  phase: ManualSyncDialogPhase
  confirmTitle: string
  confirmDescription: string
  runningTitle: string
  runningDescription: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function ManualSyncDialog({
  open,
  phase,
  confirmTitle,
  confirmDescription,
  runningTitle,
  runningDescription,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onOpenChange,
}: ManualSyncDialogProps) {
  const isRunning = phase === "running"

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isRunning && !nextOpen) {
          return
        }

        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent
        onEscapeKeyDown={(event) => {
          if (isRunning) {
            event.preventDefault()
          }
        }}
      >
        {isRunning ? (
          <Empty className="rounded-lg border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-10">
                <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{runningTitle}</EmptyTitle>
              <EmptyDescription>{runningDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0">
              <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
