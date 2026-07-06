import { TriangleAlertIcon } from "lucide-react"
import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DestructiveConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  isConfirming?: boolean
  size?: "default" | "sm"
  icon?: React.ReactNode
}

export function DestructiveConfirmDialog({
  title,
  description,
  confirmLabel = "Continuar",
  cancelLabel = "Cancelar",
  trigger,
  open,
  onOpenChange,
  onConfirm,
  isConfirming = false,
  size = "default",
  icon,
}: DestructiveConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const resolvedOpen = isControlled ? open : internalOpen

  function handleOpenChange(nextOpen: boolean) {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  return (
    <AlertDialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}

      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogMedia className="mx-auto">
            {icon ?? <TriangleAlertIcon />}
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={isConfirming}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            size="lg"
            disabled={isConfirming}
            onClick={() => {
              void onConfirm()
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
