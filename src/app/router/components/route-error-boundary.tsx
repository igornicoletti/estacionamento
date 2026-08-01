import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowUpRightIcon,
  FileQuestionIcon,
  LockKeyholeIcon,
  RotateCcwIcon,
  ServerCrashIcon,
  ShieldAlertIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import * as React from "react"
import { isRouteErrorResponse, useRouteError } from "react-router"

import { appCopy } from "@/app/constants"
import { appRoutePaths } from "@/app/router/route-registry"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

import {
  createRouteErrorId,
  reportRouteError,
} from "../route-error-reporter"

type RouteErrorContent = {
  media: ReactNode
  title: string
  description: string
}

const routeErrorMediaByStatus: Record<number, ReactNode> = {
  400: <AlertCircleIcon aria-hidden="true" />,
  401: <LockKeyholeIcon aria-hidden="true" />,
  403: <ShieldAlertIcon aria-hidden="true" />,
  404: <FileQuestionIcon aria-hidden="true" />,
  500: <ServerCrashIcon aria-hidden="true" />,
}

function getRouteErrorContent(error: unknown): RouteErrorContent {
  if (isRouteErrorResponse(error)) {
    const copy =
      appCopy.routeError.byStatus[
        error.status as keyof typeof appCopy.routeError.byStatus
      ]

    return {
      media: routeErrorMediaByStatus[error.status] ?? (
        <AlertTriangleIcon aria-hidden="true" />
      ),
      title:
        copy?.title ??
        `${error.status} — ${
          error.statusText || appCopy.routeError.fallbackStatusText
        }`,
      description:
        copy?.description ?? appCopy.routeError.unexpected.description,
    }
  }

  return {
    media: <AlertTriangleIcon aria-hidden="true" />,
    title: appCopy.routeError.unexpected.title,
    description: appCopy.routeError.unexpected.description,
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const errorId = React.useMemo(() => createRouteErrorId(), [])
  const { media, title, description } = getRouteErrorContent(error)

  React.useEffect(() => {
    reportRouteError({
      errorId,
      error,
      source: "route-boundary",
    })
  }, [error, errorId])

  return (
    <section
      role="alert"
      className="flex min-h-svh w-full flex-1 items-center justify-center bg-background p-6 text-foreground"
    >
      <AppEmptyState
        className="mx-auto max-w-xl"
        media={media}
        title={title}
        description={`${description} ${appCopy.routeError.errorIdPrefix}: ${errorId}.`}
        actions={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                window.location.reload()
              }}
            >
              <RotateCcwIcon aria-hidden="true" />
              {appCopy.routeError.retry}
            </Button>

            <Button asChild variant="link" size="lg">
              <a href={appRoutePaths.home}>
                {appCopy.routeError.action}
                <ArrowUpRightIcon aria-hidden="true" />
              </a>
            </Button>
          </div>
        }
      />
    </section>
  )
}
