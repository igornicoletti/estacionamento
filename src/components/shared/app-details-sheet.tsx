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
        "",
        className
      )}
    >
      <div className="no-scrollbar overflow-y-auto px-4 sm:px-6">
        {items.length > 0 ? (
          <dl className="grid grid-cols-1 gap-4">
            {items.map((item, index) => (
              <div key={item.id ?? index} className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </dt>

                <dd className="text-sm text-foreground">
                  {renderDetailValue(item.value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          emptyContent
        )}
      </div>
    </AppSheet>
  )
}
