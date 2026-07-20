import { LayoutDashboardIcon } from "lucide-react"
import * as React from "react"

import { PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { WorkspacePageHeader } from "@/features/workspace"
import { exportRowsToXlsx, type XlsxCellValue } from "@/lib/export"

import {
  DashboardChartsBlock,
  DashboardFilters,
  DashboardIndicatorsGrid,
  DashboardTablesBlock,
} from "../components"
import { dashboardCopy } from "../constants/dashboard-copy"
import { useDashboardSnapshot } from "../hooks/use-dashboard-snapshot"
import {
  getAlertDetailItems,
  getBillingDetailItems,
  getVehicleMovementDetailItems,
} from "../model/dashboard-details"
import {
  type DashboardAlertRow,
  type DashboardBillingRow,
  type DashboardVehicleMovementRow,
} from "../model/dashboard-types"

type DetailsState =
  | { kind: "movement"; row: DashboardVehicleMovementRow }
  | { kind: "billing"; row: DashboardBillingRow }
  | { kind: "alert"; row: DashboardAlertRow }
  | null

function normalizeExportCellValue(value: unknown): XlsxCellValue {
  if (value === null || value === undefined || value === "") {
    return null
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  return String(value)
}

export function DashboardRoute() {
  const { data, error, isLoading, refetch } = useDashboardSnapshot()
  const [range, setRange] = React.useState<"today" | "7d" | "30d">("today")
  const [movementType, setMovementType] = React.useState<"all" | "entrada" | "saida">("all")
  const [occupancyStatus, setOccupancyStatus] = React.useState<"all" | "normal" | "alert">("all")
  const [details, setDetails] = React.useState<DetailsState>(null)

  if (isLoading) {
    return (
      <PageSection>
        <WorkspacePageHeader
          pageName={dashboardCopy.page.title}
          subtitle={dashboardCopy.page.subtitle}
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
        <WorkspacePageHeader
          pageName={dashboardCopy.page.title}
          subtitle={dashboardCopy.page.subtitle}
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

  const filteredMovements = data.vehicleMovements.filter((item) => {
    if (movementType !== "all" && item.cameraType !== movementType) {
      return false
    }

    if (occupancyStatus === "alert" && item.status !== "no_patio_alerta") {
      return false
    }

    if (occupancyStatus === "normal" && item.status === "no_patio_alerta") {
      return false
    }

    return true
  })

  const filteredAlerts = data.alerts.filter((item) => {
    if (occupancyStatus === "all") {
      return true
    }

    if (occupancyStatus === "alert") {
      return item.severity === "warning" || item.severity === "critical"
    }

    return item.severity === "info"
  })

  function handleExport() {
    if (!data) {
      return
    }

    const rows = filteredMovements.map((row) => ({
      placa: row.plate,
      tipo: row.cameraType,
      camera: row.cameraName,
      captura: new Date(row.capturedAt).toLocaleString("pt-BR"),
      confianca: `${row.confidence.toFixed(1)}%`,
      permanencia: row.stayMinutes ? `${row.stayMinutes} min` : "—",
      status: row.status,
      periodo: range,
      unidade: data.unitName,
    }))

    exportRowsToXlsx({
      filename: `dashboard-${data.unitId}`,
      sheetName: "Dashboard",
      columns: [
        { header: "Placa", accessor: (row) => normalizeExportCellValue(row.placa) },
        { header: "Tipo", accessor: (row) => normalizeExportCellValue(row.tipo) },
        { header: "Câmera", accessor: (row) => normalizeExportCellValue(row.camera) },
        { header: "Captura", accessor: (row) => normalizeExportCellValue(row.captura) },
        { header: "Confiança", accessor: (row) => normalizeExportCellValue(row.confianca) },
        { header: "Permanência", accessor: (row) => normalizeExportCellValue(row.permanencia) },
        { header: "Status", accessor: (row) => normalizeExportCellValue(row.status) },
        { header: "Período", accessor: (row) => normalizeExportCellValue(row.periodo) },
        { header: "Unidade", accessor: (row) => normalizeExportCellValue(row.unidade) },
      ],
      rows,
    })
  }

  const detailsItems =
    details?.kind === "movement"
      ? getVehicleMovementDetailItems(details.row)
      : details?.kind === "billing"
        ? getBillingDetailItems(details.row)
        : details?.kind === "alert"
          ? getAlertDetailItems(details.row)
          : []

  const detailsTitle =
    details?.kind === "movement"
      ? `Veículo ${details.row.plate}`
      : details?.kind === "billing"
        ? `Faturamento ${details.row.period}`
        : details?.kind === "alert"
          ? details.row.title
          : undefined

  return (
    <PageSection>
      <WorkspacePageHeader
        pageName={dashboardCopy.page.title}
        subtitle={dashboardCopy.page.subtitle}
      />

      <section className="space-y-3">
        <DashboardFilters
          range={range}
          movementType={movementType}
          occupancyStatus={occupancyStatus}
          onRangeChange={setRange}
          onMovementTypeChange={setMovementType}
          onOccupancyStatusChange={setOccupancyStatus}
          onExportXlsx={handleExport}
        />
        <DashboardIndicatorsGrid indicators={data.indicators} />
        <DashboardChartsBlock
          occupancySeries={data.occupancySeries}
          revenueSeries={data.revenueSeries}
        />
        <DashboardTablesBlock
          vehicleMovements={filteredMovements}
          billingRows={data.billingRows}
          alerts={filteredAlerts}
          onOpenMovementDetails={(row) => setDetails({ kind: "movement", row })}
          onOpenBillingDetails={(row) => setDetails({ kind: "billing", row })}
          onOpenAlertDetails={(row) => setDetails({ kind: "alert", row })}
        />
      </section>

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
