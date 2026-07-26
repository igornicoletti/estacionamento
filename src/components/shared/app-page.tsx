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
      className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", className)}
      {...props}
    >
      {hasHeader ? (
        <div
          className={cn(
            "grid auto-rows-min gap-4 md:grid-cols-[1fr_auto]",
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
                    <p className="text-[0.8125rem]/relaxed text-muted-foreground">
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
                "grid w-full gap-2 sm:grid-cols-2 md:flex md:w-auto md:items-center md:justify-end",
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
          "flex min-h-[100vh] flex-1 flex-col md:min-h-min",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
