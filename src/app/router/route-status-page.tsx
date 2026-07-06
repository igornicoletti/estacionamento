import * as React from "react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface RouteStatusPageProps {
  title: string
  description: React.ReactNode
  icon: React.ReactNode
  children?: React.ReactNode
  actions?: React.ReactNode
  layout?: "screen" | "container"
}

export function RouteStatusPage({
  title,
  description,
  icon,
  children,
  actions,
  layout = "screen",
}: RouteStatusPageProps) {
  const layoutClassName =
    layout === "container" ? "min-h-full" : "min-h-svh"

  return (
    <main className={`flex ${layoutClassName} items-center justify-center bg-background p-6 text-foreground`}>
      <Empty className="max-w-xl">
        <EmptyHeader>
          <EmptyMedia variant="icon">{icon}</EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>

        {children || actions ? (
          <EmptyContent>
            <div className="flex flex-col gap-4">{children}</div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </EmptyContent>
        ) : null}
      </Empty>
    </main>
  )
}
