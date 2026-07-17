"use client"

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
import { useControllableOpen } from "@/hooks/use-controllable-open"
import { cn } from "@/lib/utils"

function isRenderable(value: React.ReactNode) {
  return value !== null && value !== undefined && typeof value !== "boolean"
}

export type AppAlertDialogProps = Omit<
  React.ComponentProps<typeof AlertDialog>,
  "children" | "open" | "defaultOpen" | "onOpenChange"
> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement
  title?: React.ReactNode
  description?: React.ReactNode
  media?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  showFooter?: boolean
  cancelLabel?: React.ReactNode
  actionLabel?: React.ReactNode
  actionVariant?: React.ComponentProps<typeof AlertDialogAction>["variant"]
  pendingLabel?: React.ReactNode
  onAction?: () => void | Promise<void>
  closeOnAction?: boolean
  className?: string
  contentProps?: Omit<
    React.ComponentProps<typeof AlertDialogContent>,
    "children" | "className"
  >
}

export function AppAlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  media,
  children,
  footer,
  showFooter = true,
  cancelLabel = "Cancelar",
  actionLabel = "Confirmar",
  actionVariant = "default",
  pendingLabel = "Confirmando...",
  onAction,
  closeOnAction = true,
  className,
  contentProps,
  ...props
}: AppAlertDialogProps) {
  const [currentOpen, setCurrentOpen] = useControllableOpen({
    open,
    defaultOpen,
    onOpenChange,
  })
  const [isPending, setIsPending] = React.useState(false)
  const hasHeader =
    isRenderable(media) || isRenderable(title) || isRenderable(description)
  const hasFooter = showFooter && footer !== null && footer !== false

  async function executeAction(event: React.MouseEvent<HTMLButtonElement>) {
    if (!onAction) return

    event.preventDefault()
    setIsPending(true)

    try {
      await onAction()

      if (closeOnAction) {
        setCurrentOpen(false)
      }
    } finally {
      setIsPending(false)
    }
  }

  function handleActionClick(event: React.MouseEvent<HTMLButtonElement>) {
    void executeAction(event)
  }

  return (
    <AlertDialog
      open={currentOpen}
      onOpenChange={setCurrentOpen}
      {...props}
    >
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : null}

      <AlertDialogContent {...contentProps} className={cn(className)}>
        {hasHeader ? (
          <AlertDialogHeader>
            {isRenderable(media) ? (
              <AlertDialogMedia>{media}</AlertDialogMedia>
            ) : null}

            {isRenderable(title) ? (
              <AlertDialogTitle>{title}</AlertDialogTitle>
            ) : null}

            {isRenderable(description) ? (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
        ) : null}

        {children}

        {hasFooter ? (
          <AlertDialogFooter>
            {footer === undefined ? (
              <>
                <AlertDialogCancel size="lg" disabled={isPending}>
                  {cancelLabel}
                </AlertDialogCancel>

                <AlertDialogAction
                  size="lg"
                  variant={actionVariant}
                  disabled={isPending}
                  onClick={handleActionClick}
                >
                  {isPending ? pendingLabel : actionLabel}
                </AlertDialogAction>
              </>
            ) : (
              footer
            )}
          </AlertDialogFooter>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  )
}
