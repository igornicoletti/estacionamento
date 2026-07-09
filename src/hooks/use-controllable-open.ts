"use client"

import * as React from "react"

type UseControllableOpenParams = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function useControllableOpen({
  open,
  defaultOpen = false,
  onOpenChange,
}: UseControllableOpenParams) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : internalOpen

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  return [currentOpen, setOpen] as const
}
