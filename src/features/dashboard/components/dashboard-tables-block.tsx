import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatabaseIcon } from "lucide-react"

import { type DashboardDataSnapshot } from "../model/dashboard-types"
import {
  createDashboardAlertsColumns,
  createDashboardBillingColumns,
  createDashboardMovementsColumns,
} from "../table"

export function DashboardTablesBlock({
  vehicleMovements,
  billingRows,
  alerts,
  onOpenMovementDetails,
  onOpenBillingDetails,
  onOpenAlertDetails,
}: Pick<DashboardDataSnapshot, "vehicleMovements" | "billingRows" | "alerts"> & {
  onOpenMovementDetails?: (row: DashboardDataSnapshot["vehicleMovements"][number]) => void
  onOpenBillingDetails?: (row: DashboardDataSnapshot["billingRows"][number]) => void
  onOpenAlertDetails?: (row: DashboardDataSnapshot["alerts"][number]) => void
}) {
  const movementColumns = React.useMemo(
    () => createDashboardMovementsColumns({ onOpenDetails: onOpenMovementDetails }),
    [onOpenMovementDetails]
  )
  const billingColumns = React.useMemo(
    () => createDashboardBillingColumns({ onOpenDetails: onOpenBillingDetails }),
    [onOpenBillingDetails]
  )
  const alertsColumns = React.useMemo(
    () => createDashboardAlertsColumns({ onOpenDetails: onOpenAlertDetails }),
    [onOpenAlertDetails]
  )

  return (
    <section className="grid gap-3 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Movimentações recentes de veículos</CardTitle>
          <CardDescription>
            Leituras recentes das câmeras e status operacional dos veículos no pátio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={movementColumns}
            data={vehicleMovements}
            getRowId={(row) => row.id}
            globalSearch={{
              columnIds: ["plate", "cameraType", "cameraName", "status"],
              placeholder: "Buscar movimentações...",
            }}
            emptyState={<AppEmptyState media={<DatabaseIcon />} title="Nenhuma movimentação encontrada" description="Ajuste os filtros para exibir movimentações." />}
            enablePagination
            enableViewOptions
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas e eventos críticos</CardTitle>
          <CardDescription>
            Ocorrências críticas de ocupação, operação e configuração detectadas na unidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={alertsColumns}
            data={alerts}
            getRowId={(row) => row.id}
            globalSearch={{
              columnIds: ["title", "description", "severity"],
              placeholder: "Buscar alertas...",
            }}
            emptyState={<AppEmptyState media={<DatabaseIcon />} title="Nenhum alerta encontrado" description="A unidade não possui alertas para os filtros atuais." />}
            enablePagination
            enableViewOptions
          />
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Resumo de faturamento</CardTitle>
          <CardDescription>
            Consolidado financeiro por período com foco em receita, ticket médio e pico de ocupação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={billingColumns}
            data={billingRows}
            getRowId={(row) => row.id}
            globalSearch={{
              columnIds: ["period"],
              placeholder: "Buscar faturamento...",
            }}
            emptyState={<AppEmptyState media={<DatabaseIcon />} title="Nenhum faturamento encontrado" description="Não há dados de faturamento para os filtros atuais." />}
            enablePagination
            enableViewOptions
          />
        </CardContent>
      </Card>
    </section>
  )
}
