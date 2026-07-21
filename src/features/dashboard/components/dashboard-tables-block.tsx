import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DatabaseIcon } from "lucide-react"

import { type DashboardDataSnapshot } from "../model/dashboard-types"
import {
  createDashboardMovementsColumns,
} from "../table"

const DASHBOARD_MOVEMENTS_LIMIT = 8
const DASHBOARD_ALERTS_LIMIT = 6

export function DashboardTablesBlock({
  vehicleMovements,
  alerts,
  onOpenMovementDetails,
  onOpenAlertDetails,
}: Pick<DashboardDataSnapshot, "vehicleMovements" | "alerts"> & {
  onOpenMovementDetails?: (row: DashboardDataSnapshot["vehicleMovements"][number]) => void
  onOpenAlertDetails?: (row: DashboardDataSnapshot["alerts"][number]) => void
}) {
  const movementColumns = React.useMemo(
    () => createDashboardMovementsColumns({ onOpenDetails: onOpenMovementDetails }),
    [onOpenMovementDetails]
  )
  const limitedMovements = React.useMemo(
    () => vehicleMovements.slice(0, DASHBOARD_MOVEMENTS_LIMIT),
    [vehicleMovements]
  )
  const limitedAlerts = React.useMemo(
    () => alerts.slice(0, DASHBOARD_ALERTS_LIMIT),
    [alerts]
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
        <CardContent className="max-h-96 overflow-y-auto">
          <DataTable
            columns={movementColumns}
            data={limitedMovements}
            surface="plain"
            getRowId={(row) => row.id}
            emptyState={<AppEmptyState media={<DatabaseIcon />} title="Nenhuma movimentação encontrada" description="Ajuste os filtros para exibir movimentações." />}
            enablePagination={false}
            enableViewOptions={false}
            enableExport={false}
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
          {limitedAlerts.length === 0 ? (
            <AppEmptyState
              media={<DatabaseIcon />}
              title="Nenhum alerta encontrado"
              description="A unidade não possui alertas para os filtros atuais."
            />
          ) : (
            <ScrollArea className="max-h-96 pr-1">
              <ItemGroup>
                {limitedAlerts.map((alert) => (
                  <Item
                    key={alert.id}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => onOpenAlertDetails?.(alert)}
                  >
                    <ItemMedia>
                      <Badge variant={alert.severity === "critical" ? "destructive" : "outline"}>
                        {alert.severity === "info" ? "Info" : alert.severity === "warning" ? "Alerta" : "Crítico"}
                      </Badge>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{alert.title}</ItemTitle>
                      <ItemDescription>{alert.description}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <span className="text-xs text-muted-foreground">{new Date(alert.occurredAt).toLocaleString("pt-BR")}</span>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
