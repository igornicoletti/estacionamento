import { ArrowLeftIcon, HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { Button } from "@/components/ui/button"

import { createClientVehiclesColumns } from "../columns/client-vehicles-columns"
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
  const columns = React.useMemo(() => createClientVehiclesColumns(), [])
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
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
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
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
        </div>
      </header>

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
    </div>
  )
}
