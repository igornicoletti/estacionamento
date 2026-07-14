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
import * as React from "react"
import type { ReactNode } from "react"
import {
  Link,
  isRouteErrorResponse,
  useRevalidator,
  useRouteError,
} from "react-router"

import { appCopy } from "@/app/app-copy"
import { appRoutePaths } from "@/app/router/route-registry"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

type RouteErrorContent = {
  media: ReactNode
  title: string
  description: string
}

const routeErrorMediaByStatus: Record<number, ReactNode> = {
  400: <AlertCircleIcon />,
  401: <LockKeyholeIcon />,
  403: <ShieldAlertIcon />,
  404: <FileQuestionIcon />,
  500: <ServerCrashIcon />,
}

function getRouteErrorContent(error: unknown): RouteErrorContent {
  if (isRouteErrorResponse(error)) {
    const copy = appCopy.routeError.byStatus[error.status as keyof typeof appCopy.routeError.byStatus]

    return {
      media: routeErrorMediaByStatus[error.status] ?? <AlertTriangleIcon />,
      title: copy?.title ?? `${error.status} — ${error.statusText || "Erro de rota"}`,
      description: copy?.description ?? appCopy.routeError.unexpected.description,
    }
  }

  return {
    media: <AlertTriangleIcon />,
    title: appCopy.routeError.unexpected.title,
    description: appCopy.routeError.unexpected.description,
  }
}

function createRouteErrorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `route-error-${Date.now().toString(36)}`
}

function getRouteErrorStatus(error: unknown) {
  return isRouteErrorResponse(error) ? error.status : "unexpected"
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const revalidator = useRevalidator()
  const errorId = React.useMemo(() => createRouteErrorId(), [])
  const { media, title, description } = getRouteErrorContent(error)

  React.useEffect(() => {
    const status = getRouteErrorStatus(error)

    if (import.meta.env.DEV) {
      console.error(`[route-error:${errorId}]`, error)
      return
    }

    console.error("[route-error]", { errorId, status })
  }, [error, errorId])

  return (
    <section
      role="alert"
      className="flex min-h-64 flex-1 items-center justify-center bg-background p-6 text-foreground"
    >
      <AppEmptyState
        className="mx-auto max-w-xl"
        media={media}
        title={title}
        description={`${description} Código: ${errorId}.`}
        actions={
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                void revalidator.revalidate()
              }}
            >
              <RotateCcwIcon />
              Tentar novamente
            </Button>
            <Button asChild variant="link" size="lg">
              <Link to={appRoutePaths.home} replace>
                {appCopy.routeError.action} <ArrowUpRightIcon />
              </Link>
            </Button>
          </div>
        }
      />
    </section>
  )
}
