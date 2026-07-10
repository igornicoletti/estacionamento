import { ArrowUpRightIcon, FileQuestionIcon } from "lucide-react"
import { Link } from "react-router"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

export function AppRouteNotFound() {
  return (
    <section className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <AppEmptyState
        className="mx-auto max-w-xl"
        media={<FileQuestionIcon />}
        title="404 — Não encontrado"
        description="A página que você está procurando não existe ou foi movida. Verifique o endereço informado ou retorne para o início."
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
