import * as React from "react"

import { cn } from "@/lib"

interface AppPageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  headingContent?: React.ReactNode
  headerClassName?: string
  headingClassName?: string
  actionsClassName?: string
  contentClassName?: string
}

function hasRenderableContent(value: React.ReactNode) {
  return React.Children.toArray(value).length > 0
}

export function AppPage({
  title,
  subtitle,
  actions,
  headingContent,
  headerClassName,
  headingClassName,
  actionsClassName,
  contentClassName,
  className,
  children,
  ...props
}: AppPageProps) {
  const hasHeading =
    headingContent !== undefined || title !== undefined || subtitle !== undefined
  const hasActions = hasRenderableContent(actions)
  const hasHeader = hasHeading || hasActions

  return (
    <div
      className={cn(
        "flex w-full min-w-0 max-w-full flex-1 flex-col gap-4 overflow-x-clip p-4 md:p-5",
        className
      )}
      {...props}
    >
      {hasHeader ? (
        <div
          className={cn(
            "grid min-w-0 auto-rows-min gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start",
            headerClassName
          )}
        >
          {hasHeading ? (
            <div className={cn("min-w-0 space-y-0.5", headingClassName)}>
              {headingContent ? (
                headingContent
              ) : (
                <>
                  <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="text-sm text-muted-foreground">
                      {subtitle}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div aria-hidden="true" />
          )}

          {hasActions ? (
            <div
              className={cn(
                "grid min-w-0 w-full gap-2 sm:grid-cols-2 md:flex md:w-auto md:flex-wrap md:items-center md:justify-end",
                actionsClassName
              )}
            >
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-w-0 max-w-full flex-col",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
