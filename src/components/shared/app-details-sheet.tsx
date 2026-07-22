"use client"

import * as React from "react"

import {
  AppSheet,
  type AppSheetProps,
} from "@/components/shared/app-sheet"
import { cn } from "@/lib/utils"

export interface AppDetailsSheetItem {
  id?: string
  label: React.ReactNode
  value: React.ReactNode
}

export interface AppDetailsSheetProps
  extends Omit<AppSheetProps, "children" | "trigger"> {
  items: readonly AppDetailsSheetItem[]
  emptyContent?: React.ReactNode
}

function isRenderable(value: React.ReactNode) {
  return value !== null && value !== undefined && typeof value !== "boolean"
}

function renderDetailValue(value: React.ReactNode) {
  return isRenderable(value) ? value : "—"
}

export function AppDetailsSheet({
  items,
  emptyContent = null,
  className,
  ...props
}: AppDetailsSheetProps) {
  return (
    <AppSheet
      {...props}
      className={cn(
        "data-[side=right]:w-[min(calc(100vw-2rem),28rem)] data-[side=right]:sm:max-w-md",
        className
      )}
    >
      {items.length > 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <dl className="divide-y rounded-lg border">
            {items.map((item, index) => (
              <div
                key={item.id ?? index}
                className="grid gap-1 px-3 py-3 sm:grid-cols-[minmax(8rem,11rem)_minmax(0,1fr)] sm:gap-3"
              >
                <dt className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="min-w-0 break-words text-sm text-foreground">
                  {renderDetailValue(item.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        emptyContent
      )}
    </AppSheet>
  )
}
