import { ArrowUpRightIcon, ShieldAlertIcon } from "lucide-react"
import { Link } from "react-router"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

export function AppRouteAccessDenied() {
  return (
    <section className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <AppEmptyState
        className="mx-auto max-w-xl"
        media={<ShieldAlertIcon />}
        title="Acesso negado"
        description="Você não tem permissão para acessar esta rota ou recurso."
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
