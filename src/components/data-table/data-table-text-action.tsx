import * as React from "react"

import { cn } from "@/lib/utils"

interface DataTableTextActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

interface DataTableTextLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode
}

const dataTableTextActionClassName =
  "inline-flex h-auto min-w-0 items-center justify-start gap-1 rounded-sm px-0 text-left font-medium text-foreground transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

export function DataTableTextAction({
  children,
  className,
  type = "button",
  ...props
}: DataTableTextActionProps) {
  return (
    <button
      type={type}
      className={cn(dataTableTextActionClassName, className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function DataTableTextLink({
  children,
  className,
  ...props
}: DataTableTextLinkProps) {
  return (
    <a
      className={cn(dataTableTextActionClassName, className)}
      {...props}
    >
      {children}
    </a>
  )
}
