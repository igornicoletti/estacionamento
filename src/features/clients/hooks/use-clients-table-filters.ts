import * as React from "react"

import { createDataTableFilterOptions, type DataTableFilterField } from "@/components/data-table"

import { clientsCopy } from "../constants/clients-copy"
import { type ClientTableRow } from "../model"

type ClientsTableFilterSource = Pick<ClientTableRow, "status" | "vip">

export function useClientsTableFilters(clients: readonly ClientsTableFilterSource[]) {
  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        clients,
        (client) => client.status,
        (client) => client.status === "ativo" ? clientsCopy.table.active : clientsCopy.table.inactive
      ),
    [clients]
  )
  const vipOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        clients,
        (client) => client.vip,
        (client) => client.vip === "sim" ? clientsCopy.table.yes : clientsCopy.table.no
      ),
    [clients]
  )

  return [
    { id: "status", title: clientsCopy.filters.status, options: statusOptions },
    { id: "vip", title: clientsCopy.filters.vip, options: vipOptions },
  ] satisfies readonly DataTableFilterField<ClientsTableFilterSource>[]
}
