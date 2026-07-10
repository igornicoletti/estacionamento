import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowUpRightIcon,
  FileQuestionIcon,
  LockKeyholeIcon,
  ServerCrashIcon,
  ShieldAlertIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { Link, isRouteErrorResponse, useRouteError } from "react-router"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

type AppRouteErrorContent = {
  media: ReactNode
  title: string
  description: string
}

const appRouteErrorContentByStatus: Record<number, AppRouteErrorContent> = {
  400: {
    media: <AlertCircleIcon />,
    title: "400 — Solicitação inválida",
    description: "A solicitação não pôde ser processada devido a um erro de sintaxe ou parâmetros inválidos.",
  },
  401: {
    media: <LockKeyholeIcon />,
    title: "401 — Não autorizado",
    description: "Você não está autenticado ou sua sessão expirou. Faça login novamente para acessar esta rota.",
  },
  403: {
    media: <ShieldAlertIcon />,
    title: "403 — Acesso negado",
    description: "Você não tem permissão para acessar esta rota ou recurso.",
  },
  404: {
    media: <FileQuestionIcon />,
    title: "404 — Não encontrado",
    description: "A página que você está procurando não existe ou foi movida. Verifique o endereço informado ou retorne para o início.",
  },
  500: {
    media: <ServerCrashIcon />,
    title: "500 — Erro interno do servidor",
    description: "Ocorreu um erro inesperado no servidor ao processar a solicitação. Tente novamente mais tarde ou entre em contato com o suporte.",
  },
}

function getAppRouteErrorContent(error: unknown): AppRouteErrorContent {
  if (isRouteErrorResponse(error)) {
    return (
      appRouteErrorContentByStatus[error.status] ?? {
        media: <AlertTriangleIcon />,
        title: `Erro ${error.status}`,
        description: error.statusText || "Ocorreu um erro inesperado ao processar a solicitação.",
      }
    )
  }

  return {
    media: <AlertTriangleIcon />,
    title: "Erro inesperado",
    description: "Ocorreu um erro inesperado ao processar a solicitação. Tente novamente mais tarde ou entre em contato com o suporte.",
  }
}

export function AppRouteErrorBoundary() {
  const error = useRouteError()
  const { media, title, description } = getAppRouteErrorContent(error)

  if (import.meta.env.DEV) {
    console.error(error)
  }

  return (
    <section className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <AppEmptyState
        className="mx-auto max-w-xl"
        media={media}
        title={title}
        description={description}
        actions={
          <Button asChild variant="link" size="sm">
            <Link to="/" replace>
              Voltar para o início <ArrowUpRightIcon />
            </Link>
          </Button>
        }
      />
    </section>
  )
}
