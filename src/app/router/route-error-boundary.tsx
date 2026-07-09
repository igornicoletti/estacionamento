import { AlertTriangleIcon, ArrowUpRightIcon } from "lucide-react"
import { Link, isRouteErrorResponse, useRouteError } from "react-router"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { useAuthSession } from "@/features/auth/hooks"

import { getAuthProfileRole } from "./route-auth-utils"
import { getDefaultRouteHrefForRole } from "./route-home-utils"

type RouteErrorContent = {
  description: string
  title: string
}

const routeErrorDescriptions: Record<number, string> = {
  400: "A navegação solicitada contém dados inválidos.",
  401: "Sua sessão não permite concluir esta navegação.",
  403: "Sua conta não possui permissão para acessar esta área.",
  404: "A rota ou recurso solicitado não foi encontrado.",
  500: "A aplicação encontrou uma falha ao renderizar esta rota.",
}

function getRouteErrorContent(error: unknown): RouteErrorContent {
  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} — ${error.statusText || "Erro de rota"}`,
      description:
        routeErrorDescriptions[error.status] ??
        "Não foi possível concluir a navegação solicitada.",
    }
  }

  return {
    title: "Erro inesperado",
    description:
      "A aplicação encontrou uma falha inesperada ao renderizar esta rota. Tente novamente ou retorne para a página inicial.",
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const { profile } = useAuthSession()
  const { description, title } = getRouteErrorContent(error)
  const homeHref = getDefaultRouteHrefForRole(getAuthProfileRole(profile))

  if (import.meta.env.DEV) {
    console.error(error)
  }

  return (
    <section className="flex min-h-full items-center justify-center bg-background p-6 text-foreground">
      <AppEmptyState
        className="max-w-xl"
        media={<AlertTriangleIcon />}
        title={title}
        description={description}
        actions={
          homeHref ? (
            <Button asChild variant="link" size="sm">
              <Link to={homeHref} replace>
                Voltar para o início <ArrowUpRightIcon />
              </Link>
            </Button>
          ) : null
        }
      />
    </section>
  )
}
