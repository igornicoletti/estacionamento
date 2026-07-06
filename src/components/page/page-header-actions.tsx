import * as React from "react"

import { cn } from "@/lib"

interface PageHeaderActionsProps {
  children: React.ReactNode
  className?: string
}

export function PageHeaderActions({
  children,
  className,
}: PageHeaderActionsProps) {
  const visibleChildren = React.Children.toArray(children).filter(Boolean)
  const hasTwoOrMoreActions = visibleChildren.length > 1

  return (
    <div
      className={cn(
        "grid w-full gap-2 lg:flex lg:w-auto lg:items-center lg:justify-end",
        hasTwoOrMoreActions ? "grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {visibleChildren}
    </div>
  )
}
