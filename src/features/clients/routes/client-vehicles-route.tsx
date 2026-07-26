import { ArrowLeftIcon, HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"
import { Button } from "@/components/ui/button"

import {
  getClientVehicleDetailItems,
  type ClientVehicleTableRow,
} from "../model"
import { createClientVehiclesColumns } from "../table"
import { useClientVehicles } from "../hooks/use-client-vehicles"

function parseCodPessoa(value: string | undefined) {
  const normalized = Number(value)

  return Number.isFinite(normalized) ? Math.trunc(normalized) : 0
}

function normalizeDisplayText(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function ClientVehiclesRoute() {
  const navigate = useNavigate()
  const { cod_pessoa: codPessoaParam } = useParams<{ cod_pessoa: string }>()
  const codPessoa = React.useMemo(
    () => parseCodPessoa(codPessoaParam),
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

  return (
    <AppPage
      headingContent={
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Voltar para clientes"
              onClick={() => {
                void navigate("/clientes")
              }}
            >
              <ArrowLeftIcon aria-hidden="true" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              {client?.nom_pessoa
                ? normalizeDisplayText(client.nom_pessoa)
              : "Cliente não encontrado"}
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {client?.num_cnpj_cpf || ""}
          </p>
        </>
      }
      headingClassName="max-w-2xl"
      actions={
        <>
          <Button type="button" variant="secondary" >
            <HistoryIcon aria-hidden="true" />
            Historico
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
          placeholder: "Buscar veiculos...",
        }}
        filterFields={[
          {
            id: "num_placa",
            title: "Placas",
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
          if (!open) {
            setSelectedVehicle(null)
          }
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
