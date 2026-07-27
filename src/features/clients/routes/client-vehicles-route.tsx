import { ArrowLeftIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"
import { Button } from "@/components/ui/button"

import { clientsCopy } from "../constants"
import { useClientVehicles } from "../hooks/use-client-vehicles"
import {
  formatClientDocument,
  getClientVehicleDetailItems,
  normalizeDisplayName,
  parseClientRouteId,
  type ClientVehicleTableRow,
} from "../model"
import { createClientVehiclesColumns } from "../table"

export function ClientVehiclesRoute() {
  const navigate = useNavigate()
  const { cod_pessoa: codPessoaParam } = useParams<{ cod_pessoa: string }>()
  const codPessoa = React.useMemo(
    () => parseClientRouteId(codPessoaParam) ?? 0,
    [codPessoaParam]
  )
  const { client, data, error, isLoading, refetch } = useClientVehicles(codPessoa)
  const [selectedVehicle, setSelectedVehicle] =
    React.useState<ClientVehicleTableRow | null>(null)
  const columns = React.useMemo(
    () => createClientVehiclesColumns({ onOpenDetails: setSelectedVehicle }),
    []
  )
  const plateOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data,
        (vehicle) => vehicle.num_placa,
        (vehicle) => vehicle.num_placa
      ),
    [data]
  )
  const pageTitle = client?.nom_pessoa
    ? normalizeDisplayName(client.nom_pessoa)
    : clientsCopy.pages.clientVehicles.fallbackTitle
  const pageSubtitle = formatClientDocument(
    client?.num_cnpj_cpf,
    clientsCopy.pages.clientVehicles.fallbackDescription
  )

  return (
    <AppPage
      headingContent={
        <div className="grid min-w-0 gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={clientsCopy.actions.backToClients}
              onClick={() => {
                void navigate(appRoutePaths.clients)
              }}
            >
              <ArrowLeftIcon aria-hidden="true" focusable="false" />
            </Button>
            <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
              {pageTitle}
            </h1>
          </div>
          <p className="pl-10 text-sm text-muted-foreground">
            {pageSubtitle}
          </p>
        </div>
      }
      headingClassName="min-w-0 max-w-2xl"
      actions={
        <Button
          type="button"
          variant="secondary"
          disabled={isLoading}
          onClick={() => {
            void refetch()
          }}
        >
          <RefreshCcwIcon
            data-icon="inline-start"
            aria-hidden="true"
            focusable="false"
          />
          {clientsCopy.actions.sync}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={data}
        getRowId={(vehicle) => String(vehicle.cod_veiculo)}
        globalSearch={{
          columnIds: [
            "cod_veiculo",
            "cod_pessoa",
            "nom_pessoa",
            "nom_fantasia",
            "num_cnpj_cpf",
            "num_placa",
            "des_veiculo",
            "nom_motorista",
          ],
          placeholder: clientsCopy.pages.clientVehicles.searchPlaceholder,
        }}
        filterFields={[
          {
            id: "num_placa",
            title: clientsCopy.filters.plates,
            options: plateOptions,
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
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => {
          if (!open) setSelectedVehicle(null)
        }}
        title={selectedVehicle ? "Detalhes do veículo" : undefined}
        description={
          selectedVehicle
            ? "Consulte os dados do veículo vinculado ao cliente."
            : undefined
        }
        items={
          selectedVehicle ? getClientVehicleDetailItems(selectedVehicle) : []
        }
      />
    </AppPage>
  )
}
