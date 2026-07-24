import { AlertTriangleIcon } from "lucide-react"
import {
  Link,
  isRouteErrorResponse,
  useRouteError,
} from "react-router"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useAuthSession } from "@/features/auth/hooks"

import { getAuthProfileRole } from "./route-auth-utils"
import { getDefaultRouteHrefForRole } from "./route-home-utils"

type RouteErrorContent = {
  title: string
  description: string
}

function getRouteErrorContent(error: unknown): RouteErrorContent {
  if (isRouteErrorResponse(error)) {
    const statusText = error.statusText || "Erro de rota"
    const data =
      typeof error.data === "string" && error.data.trim()
        ? error.data
        : "Não foi possível concluir a navegação solicitada."

    return {
      title: `${error.status} - ${statusText}`,
      description: data,
    }
  }

  if (error instanceof Error) {
    return {
      title: "Erro inesperado",
      description:
        "A aplicação encontrou um erro ao renderizar esta rota. Tente novamente ou retorne para a página inicial.",
    }
  }

  return {
    title: "Erro desconhecido",
    description:
      "A aplicação recebeu uma falha inesperada e não conseguiu renderizar esta rota.",
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const { profile } = useAuthSession()
  const { title, description } = getRouteErrorContent(error)
  const homeHref = getDefaultRouteHrefForRole(
    getAuthProfileRole(profile)
  )

  if (import.meta.env.DEV) {
    console.error(error)
  }

  return (
    <main className="grid min-h-full place-items-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangleIcon />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="link">
            <Link to={homeHref} replace>
              Voltar para o início
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  )
}
