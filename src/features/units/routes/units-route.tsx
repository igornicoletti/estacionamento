import { HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"
import { Button } from "@/components/ui/button"

import {
  getUnitDetailItems,
} from "../model"
import { createUnitsColumns, type UnitTableRow } from "../table"
import { useUnits } from "../hooks/use-units"

export function UnitsRoute() {
  const navigate = useNavigate()
  const { data: units, error, isLoading, refetch } = useUnits()
  const [selectedUnit, setSelectedUnit] = React.useState<UnitTableRow | null>(null)
  const columns = React.useMemo(
    () =>
      createUnitsColumns({
        onOpenDetails: setSelectedUnit,
        onSelectUsers: (unit) => {
          void navigate(`/unidades/${unit.cod_empresa}/usuarios`)
        },
      }),
    [navigate]
  )
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
    <AppPage
      title="Unidades"
      subtitle="Consulte as unidades sincronizadas a partir do ERP."
      actions={
        <>
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
        </>
      }
    >
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

      <AppDetailsSheet
        open={Boolean(selectedUnit)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUnit(null)
          }
        }}
        title={selectedUnit ? "Detalhes da unidade" : undefined}
        description={
          selectedUnit
            ? "Consulte os dados cadastrais, operacionais e de pátio da unidade."
            : undefined
        }
        items={
          selectedUnit
            ? getUnitDetailItems(
                selectedUnit,
                selectedUnit.yardConfig,
                selectedUnit.userStats
              )
            : []
        }
      />
    </AppPage>
  )
}
