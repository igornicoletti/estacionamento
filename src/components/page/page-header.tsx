import * as React from "react"

import { cn } from "@/lib"

interface PageHeaderProps {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  headingContent?: React.ReactNode
  className?: string
  contentClassName?: string
}

export function PageHeader({
  title,
  subtitle,
  actions,
  headingContent,
  className,
  contentClassName,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl space-y-2", contentClassName)}>
        {headingContent ? (
          headingContent
        ) : (
          <>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm text-balance text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </>
        )}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
