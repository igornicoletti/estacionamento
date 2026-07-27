"use client"

import { CircleAlertIcon } from "lucide-react"
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
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useControllableOpen } from "@/hooks/use-controllable-open"
import { cn } from "@/lib/utils"

type AppAlertDialogSize = "default" | "sm"
type AppAlertDialogTone = "default" | "destructive" | "warning"

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
  actionVariant?: React.ComponentProps<typeof Button>["variant"]
  pendingLabel?: React.ReactNode
  onAction?: () => void | Promise<void>
  closeOnAction?: boolean
  isPending?: boolean
  size?: AppAlertDialogSize
  tone?: AppAlertDialogTone
  className?: string
  contentProps?: Omit<
    React.ComponentProps<typeof AlertDialogContent>,
    "children" | "className" | "size"
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
  actionVariant,
  pendingLabel = "Confirmando...",
  onAction,
  closeOnAction = true,
  isPending: externalPending = false,
  size = "default",
  tone = "default",
  className,
  contentProps,
  ...props
}: AppAlertDialogProps) {
  const [currentOpen, setCurrentOpen] = useControllableOpen({
    open,
    defaultOpen,
    onOpenChange,
  })
  const [internalPending, setInternalPending] = React.useState(false)
  const pendingRef = React.useRef(false)
  const isPending = externalPending || internalPending
  const resolvedMedia =
    media === undefined ? <CircleAlertIcon aria-hidden="true" /> : media
  const hasMedia = isRenderable(resolvedMedia)
  const hasHeader =
    hasMedia || isRenderable(title) || isRenderable(description)
  const hasFooter = showFooter && footer !== null && footer !== false
  const resolvedActionVariant =
    actionVariant ?? (tone === "destructive" ? "destructive" : "default")

  async function executeAction(event: React.MouseEvent<HTMLButtonElement>) {
    if (!onAction || pendingRef.current || externalPending) return

    event.preventDefault()
    pendingRef.current = true
    setInternalPending(true)

    try {
      await onAction()

      if (closeOnAction) {
        setCurrentOpen(false)
      }
    } catch {
      // A ação mantém o diálogo aberto; o chamador é responsável pelo feedback.
    } finally {
      pendingRef.current = false
      setInternalPending(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (pendingRef.current || externalPending) return
    setCurrentOpen(nextOpen)
  }

  const mediaToneClassName =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning-foreground"
        : "bg-muted text-foreground"

  return (
    <AlertDialog open={currentOpen} onOpenChange={handleOpenChange} {...props}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : null}

      <AlertDialogContent
        {...contentProps}
        size={size}
        className={cn(className)}
      >
        {hasHeader ? (
          <AlertDialogHeader
            className={cn(
              size === "sm" && "items-center text-center",
              size === "default" &&
                hasMedia &&
                "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1"
            )}
          >
            {hasMedia ? (
              <AlertDialogMedia
                className={cn(
                  mediaToneClassName,
                  size === "default" && "row-span-2 mt-0.5"
                )}
              >
                {resolvedMedia}
              </AlertDialogMedia>
            ) : null}

            {isRenderable(title) ? (
              <AlertDialogTitle
                className={cn(size === "default" && hasMedia && "col-start-2")}
              >
                {title}
              </AlertDialogTitle>
            ) : null}

            {isRenderable(description) ? (
              <AlertDialogDescription
                className={cn(size === "default" && hasMedia && "col-start-2")}
              >
                {description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
        ) : null}

        {children}

        {hasFooter ? (
          <AlertDialogFooter
            className={cn(size === "sm" && "grid grid-cols-2")}
          >
            {footer === undefined ? (
              <>
                <AlertDialogCancel
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  disabled={isPending}
                >
                  {cancelLabel}
                </AlertDialogCancel>

                <AlertDialogAction
                  className={buttonVariants({
                    variant: resolvedActionVariant,
                    size: "lg",
                  })}
                  disabled={isPending}
                  onClick={(event) => {
                    void executeAction(event)
                  }}
                >
                  {isPending ? <Spinner data-icon="inline-start" /> : null}
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
