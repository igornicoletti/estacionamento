import * as React from "react"

import { cn } from "@/lib/utils"

export type SidebarPageHeaderProps = React.ComponentProps<"header">

export function SidebarPageHeader({
  className,
  ...props
}: SidebarPageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-(--app-header-height,4rem) shrink-0 items-center gap-2 border-b bg-background px-4 transition-[height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--app-header-height-collapsed,3rem)",
        className
      )}
      {...props}
    />
  )
}
