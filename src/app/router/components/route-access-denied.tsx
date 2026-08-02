import { ArrowUpRightIcon, ShieldAlertIcon } from "lucide-react"
import { Link } from "react-router"

import { appCopy } from "@/app/constants"
import { appRoutePaths } from "@/app/router/route-registry"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

export function RouteAccessDenied() {
  const copy = appCopy.fallback.accessDenied

  return (
    <section className="flex min-h-64 flex-1 items-center justify-center bg-background p-6 text-foreground">
      <AppEmptyState
        media={<ShieldAlertIcon aria-hidden="true" />}
        title={copy.title}
        description={copy.description}
        actions={
          <Button asChild variant="link" size="lg">
            <Link to={appRoutePaths.home} replace>
              {copy.action} <ArrowUpRightIcon aria-hidden="true" />
            </Link>
          </Button>
        }
      />
    </section>
  )
}
