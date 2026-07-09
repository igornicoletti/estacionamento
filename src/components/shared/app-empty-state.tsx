import * as React from "react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

function isRenderable(value: React.ReactNode) {
  return value !== null && value !== undefined && typeof value !== "boolean"
}

export type AppEmptyStateProps = Omit<
  React.ComponentProps<typeof Empty>,
  "children" | "title"
> & {
  media?: React.ReactNode
  mediaVariant?: React.ComponentProps<typeof EmptyMedia>["variant"]
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function AppEmptyState({
  media,
  mediaVariant = "icon",
  title,
  description,
  actions,
  children,
  className,
  ...props
}: AppEmptyStateProps) {
  const hasHeader =
    isRenderable(media) || isRenderable(title) || isRenderable(description)
  const hasContent = isRenderable(children) || isRenderable(actions)

  return (
    <Empty className={cn(className)} {...props}>
      {hasHeader ? (
        <EmptyHeader>
          {isRenderable(media) ? (
            <EmptyMedia variant={mediaVariant}>{media}</EmptyMedia>
          ) : null}

          {isRenderable(title) ? <EmptyTitle>{title}</EmptyTitle> : null}

          {isRenderable(description) ? (
            <EmptyDescription>{description}</EmptyDescription>
          ) : null}
        </EmptyHeader>
      ) : null}

      {hasContent ? (
        <EmptyContent>
          {children}
          {actions}
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
