import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState, AppTabs } from "@/components/shared"
import { DatabaseIcon } from "lucide-react"

import { type ReportsSnapshot } from "../model/reports-types"
import {
  createReportsBillingColumns,
  createReportsOccupancyColumns,
  createReportsVehicleColumns,
} from "../table"

type ReportsTabsContentProps = {
  data: ReportsSnapshot | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

export function ReportsTabsContent({
  data,
  error,
  isLoading,
  onRetry,
}: ReportsTabsContentProps) {
  const vehicleColumns = React.useMemo(() => createReportsVehicleColumns(), [])
  const billingColumns = React.useMemo(() => createReportsBillingColumns(), [])
  const occupancyColumns = React.useMemo(() => createReportsOccupancyColumns(), [])

  const vehicleRows = data?.vehicleMovements ?? []
  const billingRows = data?.billingRows ?? []
  const occupancyRows = data?.occupancyAlerts ?? []

  const tabs = [
    {
      value: "vehicle_movement",
      label: "Movimentação de veículos",
      content: (
        <DataTable
          columns={vehicleColumns}
          data={vehicleRows}
          getRowId={(row) => row.id}
          globalSearch={{
            columnIds: ["plate", "cameraType", "cameraName", "status"],
            placeholder: "Buscar movimentações...",
          }}
          emptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem movimentações" description="Nenhum registro disponível para o período atual." />}
          filteredEmptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem resultado" description="Ajuste os filtros para encontrar movimentações." />}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          enablePagination
          enableViewOptions
        />
      ),
    },
    {
      value: "billing",
      label: "Faturamento",
      content: (
        <DataTable
          columns={billingColumns}
          data={billingRows}
          getRowId={(row) => row.id}
          globalSearch={{
            columnIds: ["referenceDate", "rulesVersionLabel", "pricesVersionLabel"],
            placeholder: "Buscar faturamento...",
          }}
          emptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem faturamento" description="Nenhum lançamento disponível para o período atual." />}
          filteredEmptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem resultado" description="Ajuste os filtros para encontrar lançamentos." />}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          enablePagination
          enableViewOptions
        />
      ),
    },
    {
      value: "occupancy_alerts",
      label: "Ocupação e alertas",
      content: (
        <DataTable
          columns={occupancyColumns}
          data={occupancyRows}
          getRowId={(row) => row.id}
          globalSearch={{
            columnIds: ["severity", "description"],
            placeholder: "Buscar alertas operacionais...",
          }}
          emptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem alertas" description="A unidade não possui alertas no período filtrado." />}
          filteredEmptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem resultado" description="Ajuste os filtros para encontrar alertas." />}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          enablePagination
          enableViewOptions
        />
      ),
    },
  ] as const

  return (
    <AppTabs items={tabs} defaultValue="vehicle_movement" />
  )
}
