"use client"

import * as React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function isRenderable(value: React.ReactNode) {
  return value !== null && value !== undefined && typeof value !== "boolean"
}

export type AppSheetProps = Omit<
  React.ComponentProps<typeof Sheet>,
  "children"
> & {
  trigger?: React.ReactElement
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  side?: React.ComponentProps<typeof SheetContent>["side"]
  className?: string
  contentProps?: Omit<
    React.ComponentProps<typeof SheetContent>,
    "children" | "className" | "side"
  >
}

export function AppSheet({
  trigger,
  title,
  description,
  children,
  footer,
  side,
  className,
  contentProps,
  ...props
}: AppSheetProps) {
  const hasHeader = isRenderable(title) || isRenderable(description)

  return (
    <Sheet {...props}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}

      <SheetContent {...contentProps} side={side} className={cn(className)}>
        {hasHeader ? (
          <SheetHeader>
            {isRenderable(title) ? <SheetTitle>{title}</SheetTitle> : null}

            {isRenderable(description) ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
        ) : null}

        {children}

        {isRenderable(footer) ? <SheetFooter>{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}
