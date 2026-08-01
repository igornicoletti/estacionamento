import { UsersRoundIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"

import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENTS_TABLE_COLUMN_VISIBILITY_KEY,
  DEFAULT_CLIENTS_COLUMN_VISIBILITY,
} from "../constants/clients-persistence"
import { useClientsTableFilters } from "../hooks/use-clients-table-filters"
import { type ClientTableRow } from "../model/clients-types"
import { createClientsColumns } from "../table/clients-columns"

interface ClientsTableProps {
  data: ClientTableRow[]
  error: Error | null
  isLoading: boolean
  onOpenDetails: (client: ClientTableRow) => void
  onRetry: () => void
  onSelectVehicles: (client: ClientTableRow) => void
}

export function ClientsTable({
  data,
  error,
  isLoading,
  onOpenDetails,
  onRetry,
  onSelectVehicles,
}: ClientsTableProps) {
  const columns = React.useMemo(
    () => createClientsColumns({ onOpenDetails, onSelectVehicles }),
    [onOpenDetails, onSelectVehicles]
  )
  const filterFields = useClientsTableFilters(data)

  return (
    <DataTable
      ariaLabel={clientsCopy.pages.clients.tableAriaLabel}
      columns={columns}
      data={data}
      defaultColumnVisibility={DEFAULT_CLIENTS_COLUMN_VISIBILITY}
      columnVisibilityStorageKey={CLIENTS_TABLE_COLUMN_VISIBILITY_KEY}
      getRowId={(client) => String(client.cod_pessoa)}
      globalSearch={{
        columnIds: [
          "cod_pessoa",
          "nom_pessoa",
          "nom_fantasia",
          "num_cnpj_cpf",
          "des_email_1",
          "num_telefone_1",
          "nom_cidade",
          "sgl_estado",
        ],
        placeholder: clientsCopy.pages.clients.searchPlaceholder,
      }}
      filterFields={filterFields}
      emptyState={(
        <AppEmptyState
          media={<UsersRoundIcon aria-hidden="true" />}
          title={clientsCopy.empty.clientsTitle}
          description={clientsCopy.empty.clientsDescription}
        />
      )}
      filteredEmptyState={(
        <AppEmptyState
          media={<UsersRoundIcon aria-hidden="true" />}
          title={clientsCopy.filteredEmpty.clientsTitle}
          description={clientsCopy.filteredEmpty.clientsDescription}
        />
      )}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      enablePagination
      enableViewOptions
    />
  )
}
