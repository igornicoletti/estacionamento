import { ConstructionIcon } from "lucide-react"

import { appCopy } from "@/app/constants/app-copy"
import { AppEmptyState } from "@/components/shared/app-empty-state"

function ProductionUnavailableRoute() {
  return (
    <div className="flex min-h-80 items-center justify-center p-4 md:p-5">
      <AppEmptyState
        media={<ConstructionIcon aria-hidden="true" />}
        title={appCopy.fallback.moduleUnavailable.title}
        description={appCopy.fallback.moduleUnavailable.description}
      />
    </div>
  )
}

export function ProductionDashboardRoute() {
  return <ProductionUnavailableRoute />
}

export function ProductionYardRoute() {
  return <ProductionUnavailableRoute />
}

export function ProductionReportsRoute() {
  return <ProductionUnavailableRoute />
}
