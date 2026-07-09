"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function isRenderable(value: React.ReactNode) {
  return value !== null && value !== undefined && typeof value !== "boolean"
}

export type AppDialogProps = Omit<
  React.ComponentProps<typeof Dialog>,
  "children"
> & {
  trigger?: React.ReactElement
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentProps?: Omit<
    React.ComponentProps<typeof DialogContent>,
    "children" | "className"
  >
}

export function AppDialog({
  trigger,
  title,
  description,
  children,
  footer,
  className,
  contentProps,
  ...props
}: AppDialogProps) {
  const hasHeader = isRenderable(title) || isRenderable(description)

  return (
    <Dialog {...props}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent {...contentProps} className={cn(className)}>
        {hasHeader ? (
          <DialogHeader>
            {isRenderable(title) ? <DialogTitle>{title}</DialogTitle> : null}

            {isRenderable(description) ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
        ) : null}
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          {children}
        </div>
        {isRenderable(footer) ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
