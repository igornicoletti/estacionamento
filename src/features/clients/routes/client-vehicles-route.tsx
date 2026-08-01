import {
  ArrowLeftIcon,
  RefreshCcwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import * as React from "react"
import { useNavigate, useParams } from "react-router"

import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppPage } from "@/components/shared/app-page"
import { Button } from "@/components/ui/button"

import { ClientVehiclesTable } from "../components/client-vehicles-table"
import { clientsCopy } from "../constants/clients-copy"
import { clientsRoutePaths } from "../constants/clients-routes"
import { useClientVehicles } from "../hooks/use-client-vehicles"
import { getClientVehicleDetailItems } from "../model/clients-details-model"
import {
  formatClientDocument,
  parseClientRouteId,
} from "../model/clients-formatters"
import { type ClientVehicleTableRow } from "../model/clients-types"

export function ClientVehiclesRoute() {
  const { cod_pessoa: clientIdParam } = useParams<{
    cod_pessoa: string
  }>()
  const clientId = parseClientRouteId(clientIdParam)

  if (clientId === null) {
    return <InvalidClientRoute />
  }

  return <ResolvedClientVehiclesRoute clientId={clientId} />
}

function InvalidClientRoute() {
  const navigate = useNavigate()

  return (
    <AppPage
      title={clientsCopy.pages.clientVehicles.invalidTitle}
      subtitle={clientsCopy.pages.clientVehicles.invalidDescription}
    >
      <AppEmptyState
        media={<TriangleAlertIcon aria-hidden="true" />}
        title={clientsCopy.pages.clientVehicles.invalidTitle}
        description={clientsCopy.pages.clientVehicles.invalidDescription}
        actions={(
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void navigate(clientsRoutePaths.list)
            }}
          >
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            {clientsCopy.actions.backToClients}
          </Button>
        )}
      />
    </AppPage>
  )
}

function ResolvedClientVehiclesRoute({ clientId }: { clientId: number }) {
  const navigate = useNavigate()
  const { client, data, error, isLoading, refetch } =
    useClientVehicles(clientId)
  const [selectedVehicle, setSelectedVehicle] =
    React.useState<ClientVehicleTableRow | null>(null)
  const openVehicleDetails = React.useCallback(
    (vehicle: ClientVehicleTableRow) => {
      setSelectedVehicle(vehicle)
    },
    []
  )
  const isClientUnavailable = !isLoading && !error && !client
  const pageTitle =
    client?.nom_pessoa ??
    (isLoading
      ? clientsCopy.pages.clients.title
      : clientsCopy.pages.clientVehicles.fallbackTitle)
  const pageSubtitle = client
    ? formatClientDocument(
        client.num_cnpj_cpf,
        clientsCopy.pages.clientVehicles.fallbackDescription
      )
    : isLoading
      ? clientsCopy.pages.clients.subtitle
      : clientsCopy.pages.clientVehicles.fallbackDescription

  return (
    <AppPage
      title={pageTitle}
      subtitle={pageSubtitle}
      actions={(
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void navigate(clientsRoutePaths.list)
            }}
          >
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            {clientsCopy.actions.backToClients}
          </Button>
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
        </>
      )}
    >
      <ClientVehiclesTable
        data={client ? data : []}
        error={error}
        isClientUnavailable={isClientUnavailable}
        isLoading={isLoading}
        onOpenDetails={openVehicleDetails}
        onRetry={() => {
          void refetch()
        }}
      />

      <AppDetailsSheet
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVehicle(null)
          }
        }}
        title={
          selectedVehicle ? clientsCopy.details.vehicleTitle : undefined
        }
        description={
          selectedVehicle
            ? clientsCopy.details.vehicleDescription
            : undefined
        }
        items={
          selectedVehicle
            ? getClientVehicleDetailItems(selectedVehicle)
            : []
        }
      />
    </AppPage>
  )
}
