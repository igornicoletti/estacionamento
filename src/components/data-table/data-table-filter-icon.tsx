import { type LucideIcon } from "lucide-react"
import * as React from "react"

export type DataTableFilterKind = "faceted" | "search"

interface DataTableFilterIconProps {
  icon: LucideIcon
  className?: string
}

export function DataTableFilterIcon({
  icon,
  className,
}: DataTableFilterIconProps) {
  const iconProps: React.ComponentProps<LucideIcon> & {
    "data-icon": string
    "data-slot": string
  } = {
    "aria-hidden": true,
    className,
    "data-icon": "inline-start",
    "data-slot": "data-table-filter-icon",
    focusable: "false",
  }

  return React.createElement(icon, iconProps)
}
