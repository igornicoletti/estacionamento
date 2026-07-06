import * as React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export interface DataTableDetailsItem {
  label: string
  value: React.ReactNode
}

export interface DataTableDetailsProps {
  title: string
  description: string
  items: readonly DataTableDetailsItem[]
  trigger: React.ReactNode
}

export type DataTableDetailsConfig = Omit<DataTableDetailsProps, "trigger">

interface DataTableDetailsTextTriggerProps
  extends React.ComponentPropsWithoutRef<"button"> {
  children: React.ReactNode
}

function normalizeDetailsValue(value: React.ReactNode) {
  if (value === null || value === undefined || value === "") {
    return "—"
  }

  return value
}

export function DataTableDetails({
  title,
  description,
  items,
  trigger,
}: DataTableDetailsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="no-scrollbar overflow-y-auto px-6">
          <dl className="grid grid-cols-1 gap-4 py-4">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-0.5"
              >
                <dt className="text-xs text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {normalizeDetailsValue(item.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export const DataTableDetailsTextTrigger = React.forwardRef<
  HTMLButtonElement,
  DataTableDetailsTextTriggerProps
>(function DataTableDetailsTextTrigger(
  { children, className, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      data-no-drag-scroll="true"
      type={type}
      className={cn(
        "text-left font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
