import { RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"
import { Button } from "@/components/ui/button"

import { ClientsTable } from "../components/clients-table"
import { clientsCopy } from "../constants/clients-copy"
import { clientsRoutePaths } from "../constants/clients-routes"
import { useClients } from "../hooks/use-clients"
import { getClientDetailItems } from "../model/clients-details-model"
import { type ClientTableRow } from "../model/clients-types"

export function ClientsRoute() {
  const navigate = useNavigate()
  const { data, error, isLoading, refetch } = useClients()
  const [selectedClient, setSelectedClient] =
    React.useState<ClientTableRow | null>(null)
  const openClientDetails = React.useCallback((client: ClientTableRow) => {
    setSelectedClient(client)
  }, [])
  const openClientVehicles = React.useCallback(
    (client: ClientTableRow) => {
      void navigate(clientsRoutePaths.vehicles(client.cod_pessoa))
    },
    [navigate]
  )

  return (
    <AppPage
      title={clientsCopy.pages.clients.title}
      subtitle={clientsCopy.pages.clients.subtitle}
      actions={(
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
          />
          {clientsCopy.actions.refresh}
        </Button>
      )}
    >
      <ClientsTable
        data={data}
        error={error}
        isLoading={isLoading}
        onOpenDetails={openClientDetails}
        onSelectVehicles={openClientVehicles}
        onRetry={() => {
          void refetch()
        }}
      />

      <AppDetailsSheet
        open={Boolean(selectedClient)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedClient(null)
          }
        }}
        title={
          selectedClient ? clientsCopy.details.clientTitle : undefined
        }
        description={
          selectedClient
            ? clientsCopy.details.clientDescription
            : undefined
        }
        items={selectedClient ? getClientDetailItems(selectedClient) : []}
      />
    </AppPage>
  )
}
