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
          {alerts.length === 0 ? (
            <AppEmptyState
              media={<DatabaseIcon />}
              title="Nenhum alerta encontrado"
              description="A unidade não possui alertas para os filtros atuais."
            />
          ) : (
            <ScrollArea className="h-100 pr-1">
              <ItemGroup>
                {alerts.map((alert) => (
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
