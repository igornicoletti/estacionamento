import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DashboardFiltersProps = {
  range: "today" | "7d" | "30d"
  movementType: "all" | "entrada" | "saida"
  occupancyStatus: "all" | "normal" | "alert"
  onRangeChange: (value: "today" | "7d" | "30d") => void
  onMovementTypeChange: (value: "all" | "entrada" | "saida") => void
  onOccupancyStatusChange: (value: "all" | "normal" | "alert") => void
  onExportXlsx: () => void
}

export function DashboardFilters({
  movementType,
  occupancyStatus,
  onExportXlsx,
  onMovementTypeChange,
  onOccupancyStatusChange,
  onRangeChange,
  range,
}: DashboardFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros e exportação</CardTitle>
        <CardDescription>Refine os dados exibidos e exporte o recorte atual para análise externa.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
        <Select value={range} onValueChange={(value) => onRangeChange(value as "today" | "7d" | "30d")}>
          <SelectTrigger aria-label="Período" className="w-full">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={movementType} onValueChange={(value) => onMovementTypeChange(value as "all" | "entrada" | "saida")}>
          <SelectTrigger aria-label="Tipo de movimentação" className="w-full">
            <SelectValue placeholder="Tipo de movimentação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={occupancyStatus} onValueChange={(value) => onOccupancyStatusChange(value as "all" | "normal" | "alert")}>
          <SelectTrigger aria-label="Status de ocupação" className="w-full">
            <SelectValue placeholder="Status de ocupação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="normal">Status normal</SelectItem>
            <SelectItem value="alert">Status em alerta</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" variant="secondary" size="lg" className="w-full lg:w-auto" onClick={onExportXlsx}>
          <DownloadIcon aria-hidden="true" />
          Exportar
        </Button>
      </CardContent>
    </Card>
  )
}
