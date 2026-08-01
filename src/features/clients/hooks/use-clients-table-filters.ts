import * as React from "react"

import {
  createDataTableFilterOptions,
  defineDataTableCustomColumnId,
  type DataTableFilterField,
} from "@/components/data-table"

import { clientsCopy } from "../constants/clients-copy"
import { formatClientCityState } from "../model/clients-formatters"
import { type ClientTableRow } from "../model/clients-types"

type ClientsTableFilterSource = Pick<
  ClientTableRow,
  "nom_cidade" | "sgl_estado" | "status"
>

const clientCityStateColumnId =
  defineDataTableCustomColumnId("cidadeUf")

export function useClientsTableFilters(
  clients: readonly ClientsTableFilterSource[]
) {
  const cityOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        clients,
        formatClientCityState,
        formatClientCityState
      ),
    [clients]
  )
  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        clients,
        (client) => client.status,
        (client) =>
          client.status === "ativo"
            ? clientsCopy.table.active
            : clientsCopy.table.inactive
      ),
    [clients]
  )

  return [
    {
      id: clientCityStateColumnId,
      title: clientsCopy.filters.cities,
      options: cityOptions,
    },
    {
      id: "status",
      title: clientsCopy.filters.status,
      options: statusOptions,
    },
  ] satisfies readonly DataTableFilterField<ClientsTableFilterSource>[]
}
