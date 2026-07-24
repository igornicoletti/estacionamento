import { HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { Button } from "@/components/ui/button"

import { createUnitsColumns } from "../columns/units-columns"
import { useUnits } from "../hooks/use-units"

export function UnitsRoute() {
  const { data: units, error, isLoading, refetch } = useUnits()
  const columns = React.useMemo(() => createUnitsColumns(), [])
  const brandOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        units,
        (unit) => unit.des_bandeira,
        (unit) => unit.des_bandeira
      ),
    [units]
  )
  const stateOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        units,
        (unit) => unit.sgl_estado,
        (unit) => unit.sgl_estado
      ),
    [units]
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Unidades</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Consulte as unidades sincronizadas a partir do ERP.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
          <Button type="button" variant="secondary" >
            <HistoryIcon aria-hidden="true" />
            Histórico
          </Button>
          <Button
            type="button"
            variant="secondary"

            disabled={isLoading}
            onClick={() => {
              void refetch()
            }}
          >
            <RefreshCcwIcon aria-hidden="true" />
            Sincronizar
          </Button>
        </div>
      </header>

      <DataTable
        columns={columns}
        data={units}
        getRowId={(unit) => String(unit.cod_empresa)}
        globalSearch={{
          columnIds: [
            "cod_empresa",
            "nom_razao_social",
            "nom_fantasia",
            "num_cnpj",
            "des_bandeira",
            "nom_cidade",
            "nom_estado",
            "sgl_estado",
            "ip_rede",
            "nom_banco_dados",
          ],
          placeholder: "Buscar unidades...",
        }}
        filterFields={[
          {
            id: "des_bandeira",
            title: "Bandeiras",
            options: brandOptions,
          },
          {
            id: "sgl_estado",
            title: "Estados",
            options: stateOptions,
          },
        ]}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />
    </div>
  )
}
