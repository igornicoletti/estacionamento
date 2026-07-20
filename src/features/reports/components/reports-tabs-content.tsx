import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatabaseIcon } from "lucide-react"

import { type ReportsSnapshot } from "../model/reports-types"
import {
  createReportsBillingColumns,
  createReportsOccupancyColumns,
  createReportsVehicleColumns,
} from "../table"

type ReportsTabsContentProps = {
  data: ReportsSnapshot
}

export function ReportsTabsContent({ data }: ReportsTabsContentProps) {
  const vehicleColumns = React.useMemo(() => createReportsVehicleColumns(), [])
  const billingColumns = React.useMemo(() => createReportsBillingColumns(), [])
  const occupancyColumns = React.useMemo(() => createReportsOccupancyColumns(), [])

  return (
    <Tabs defaultValue="vehicle_movement" className="gap-4">
      <TabsList className="h-auto w-fit gap-1 rounded-lg border bg-muted/60 p-1">
        <TabsTrigger value="vehicle_movement" className="px-4">Movimentação de veículos</TabsTrigger>
        <TabsTrigger value="billing" className="px-4">Faturamento</TabsTrigger>
        <TabsTrigger value="occupancy_alerts" className="px-4">Ocupação e alertas</TabsTrigger>
      </TabsList>

      <TabsContent value="vehicle_movement" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Relatório de capturas e movimentações</CardTitle>
            <CardDescription>Eventos de entrada e saída capturados por câmera com status operacional.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={vehicleColumns}
              data={data.vehicleMovements}
              getRowId={(row) => row.id}
              globalSearch={{
                columnIds: ["plate", "cameraType", "cameraName", "status"],
                placeholder: "Buscar movimentações...",
              }}
              emptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem movimentações" description="Nenhum registro disponível para o período atual." />}
              enablePagination
              enableViewOptions
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Relatório de faturamento por período</CardTitle>
            <CardDescription>Consolidação de receita com vínculo às versões de regras e preços aplicadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={billingColumns}
              data={data.billingRows}
              getRowId={(row) => row.id}
              globalSearch={{
                columnIds: ["referenceDate", "rulesVersionLabel", "pricesVersionLabel"],
                placeholder: "Buscar faturamento...",
              }}
              emptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem faturamento" description="Nenhum lançamento disponível para o período atual." />}
              enablePagination
              enableViewOptions
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="occupancy_alerts" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Ocupação e alertas operacionais</CardTitle>
            <CardDescription>Monitoramento da pressão de ocupação para prevenir superlotação da unidade.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={occupancyColumns}
              data={data.occupancyAlerts}
              getRowId={(row) => row.id}
              globalSearch={{
                columnIds: ["severity", "description"],
                placeholder: "Buscar alertas operacionais...",
              }}
              emptyState={<AppEmptyState media={<DatabaseIcon />} title="Sem alertas" description="A unidade não possui alertas no período filtrado." />}
              enablePagination
              enableViewOptions
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
