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
        "flex min-h-0 flex-col gap-6 lg:min-h-0 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className={cn("min-w-0 space-y-1", contentClassName)}>
        {headingContent ? (
          headingContent
        ) : (
          <>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm/relaxed text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </>
        )}
      </div>

      {actions ? (
        <div className="w-full shrink-0 lg:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
