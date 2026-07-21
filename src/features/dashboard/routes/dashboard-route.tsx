import { LayoutDashboardIcon } from "lucide-react"
import * as React from "react"

import { PageHeader, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppUnitSelector, useSelectedUnit } from "@/components/shared/app-unit-selector"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import {
  DashboardBentoGrid,
} from "../components"
import { dashboardCopy } from "../constants/dashboard-copy"
import { useDashboardSnapshot } from "../hooks/use-dashboard-snapshot"
import {
  getAlertDetailItems,
  getVehicleMovementDetailItems,
} from "../model/dashboard-details"
import {
  type DashboardAlertRow,
  type DashboardVehicleMovementRow,
} from "../model/dashboard-types"

type DetailsState =
  | { kind: "movement"; row: DashboardVehicleMovementRow }
  | { kind: "alert"; row: DashboardAlertRow }
  | null

export function DashboardRoute() {
  const { selectedUnitName } = useSelectedUnit()
  const { data, error, isLoading, refetch } = useDashboardSnapshot()
  const [details, setDetails] = React.useState<DetailsState>(null)
  const pageTitle = `${dashboardCopy.page.title} — ${selectedUnitName}`

  if (isLoading) {
    return (
      <PageSection>
        <PageHeader
          title={pageTitle}
          subtitle={dashboardCopy.page.subtitle}
          actions={<AppUnitSelector />}
        />

        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-6 text-primary" aria-label={dashboardCopy.page.title} />
        </div>
      </PageSection>
    )
  }

  if (error || !data) {
    return (
      <PageSection>
        <PageHeader
          title={pageTitle}
          subtitle={dashboardCopy.page.subtitle}
          actions={<AppUnitSelector />}
        />

        <div className="flex flex-1 items-center justify-center">
          <AppEmptyState
            className="mx-auto max-w-md"
            media={<LayoutDashboardIcon />}
            title="Não foi possível carregar o dashboard"
            description="Tente novamente para recarregar os indicadores da unidade selecionada."
            actions={(
              <Button type="button" variant="secondary" size="lg" onClick={() => { void refetch() }}>
                Recarregar
              </Button>
            )}
          />
        </div>
      </PageSection>
    )
  }

  const detailsItems =
    details?.kind === "movement"
      ? getVehicleMovementDetailItems(details.row)
      : details?.kind === "alert"
        ? getAlertDetailItems(details.row)
        : []

  const detailsTitle =
    details?.kind === "movement"
      ? `Veículo ${details.row.plate}`
      : details?.kind === "alert"
        ? details.row.title
        : undefined

  return (
    <PageSection>
      <PageHeader
        title={pageTitle}
        subtitle={dashboardCopy.page.subtitle}
        actions={<AppUnitSelector />}
      />

      <DashboardBentoGrid
        snapshot={data}
        onOpenMovementDetails={(row) => setDetails({ kind: "movement", row })}
        onOpenAlertDetails={(row) => setDetails({ kind: "alert", row })}
      />

      <AppDetailsSheet
        open={Boolean(details)}
        onOpenChange={(open) => {
          if (!open) {
            setDetails(null)
          }
        }}
        title={detailsTitle}
        description={details ? "Detalhes complementares do registro selecionado." : undefined}
        items={detailsItems}
      />
    </PageSection>
  )
}
