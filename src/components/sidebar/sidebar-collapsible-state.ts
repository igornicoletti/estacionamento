"use client"

import * as React from "react"

import type { SidebarCollapsibleState } from "./sidebar.types"

type UseSidebarCollapsibleStateOptions = SidebarCollapsibleState & {
  fallbackOpen: boolean
}

export function useSidebarCollapsibleState(
  options: UseSidebarCollapsibleStateOptions
) {
  const [internalOpen, setInternalOpen] = React.useState(
    options.defaultOpen ?? options.fallbackOpen
  )
  const controlled = options.open !== undefined
  const open = controlled ? options.open : internalOpen
  const onOpenChange = options.onOpenChange

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!controlled) {
        setInternalOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [controlled, onOpenChange]
  )

  return [open, setOpen] as const
}
