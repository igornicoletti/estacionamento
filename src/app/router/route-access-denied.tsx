import { ArrowUpRightIcon, ShieldAlertIcon } from "lucide-react"
import { Link } from "react-router"

import { useAuthSession } from "@/features/auth/hooks"

import { Button } from "@/components/ui/button"

import { getAuthProfileRole } from "./route-auth-utils"
import { getDefaultRouteHrefForRole } from "./route-home-utils"
import { RouteStatusPage } from "./route-status-page"

export function RouteAccessDenied() {
  const { profile } = useAuthSession()
  const homeHref = getDefaultRouteHrefForRole(
    getAuthProfileRole(profile)
  )

  return (
    <RouteStatusPage
      layout="container"
      icon={<ShieldAlertIcon />}
      title="403 — Acesso negado"
      description={
        "Sua conta está ativa, mas não possui permissão para acessar esta área. Solicite liberação a um administrador se este acesso fizer parte da sua função."
      }
      actions={
        <Button variant="link" asChild size="sm">
          <Link to={homeHref}>
            Voltar para o início <ArrowUpRightIcon />
          </Link>
        </Button>
      }
    />
  )
}
