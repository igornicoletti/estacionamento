import type * as React from "react"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface DataTableTextActionProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children"
  > {
  children: React.ReactNode
  isPending?: boolean
  pendingLabel?: React.ReactNode
  stopPropagation?: boolean
}

interface DataTableTextLinkProps
  extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "children" | "href"
  > {
  children: React.ReactNode
  href: string
  stopPropagation?: boolean
}

const dataTableTextActionClassName =
  "inline-flex h-auto max-w-full min-w-0 cursor-pointer items-center justify-start gap-1 rounded-sm px-0.5 py-0.5 text-left font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"

export function DataTableTextAction({
  children,
  className,
  type = "button",
  disabled,
  isPending = false,
  pendingLabel,
  stopPropagation = true,
  onClick,
  "aria-busy": externalAriaBusy,
  ...props
}: DataTableTextActionProps) {
  return (
    <button
      {...props}
      data-no-drag-scroll="true"
      type={type}
      disabled={disabled === true || isPending}
      aria-busy={isPending ? true : externalAriaBusy}
      className={cn(dataTableTextActionClassName, className)}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation()
        onClick?.(event)
      }}
    >
      {isPending ? (
        <Spinner
          data-icon="inline-start"
          role={undefined}
          aria-label={undefined}
          aria-hidden="true"
          focusable="false"
          className="size-3.5"
        />
      ) : null}
      {isPending && pendingLabel !== undefined ? pendingLabel : children}
    </button>
  )
}

export function DataTableTextLink({
  children,
  href,
  className,
  stopPropagation = true,
  onClick,
  ...props
}: DataTableTextLinkProps) {
  return (
    <a
      {...props}
      data-no-drag-scroll="true"
      href={href}
      className={cn(dataTableTextActionClassName, className)}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation()
        onClick?.(event)
      }}
    >
      {children}
    </a>
  )
}
