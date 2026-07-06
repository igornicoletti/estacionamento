import * as React from "react"

import {
  listClientsSnapshot,
} from "../services/clients-service"
import {
  type Client,
  type ClientVehicle,
} from "../types/clients-types"

const vehiclesLoadError = "Não foi possível carregar os veículos do cliente."

function resolveClientVehiclesSnapshot(
  codPessoa: number,
  clients: readonly Client[],
  vehicles: readonly ClientVehicle[]
) {
  return {
    client:
      clients.find((currentClient) => currentClient.cod_pessoa === codPessoa) ?? null,
    vehicles: vehicles.filter((vehicle) => vehicle.cod_pessoa === codPessoa),
  }
}

export function useClientVehicles(codPessoa: number) {
  const [data, setData] = React.useState<ClientVehicle[]>([])
  const [client, setClient] = React.useState<Client | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const loadVehicles = React.useCallback(async (
    isCurrent: () => boolean,
    options: { setLoading?: boolean } = {}
  ) => {
    const shouldSetLoading = options.setLoading ?? true

    try {
      if (shouldSetLoading) {
        setIsLoading(true)
      }
      setError(null)

      const snapshotData = await listClientsSnapshot()

      if (!isCurrent()) {
        return
      }

      const snapshot = resolveClientVehiclesSnapshot(
        codPessoa,
        snapshotData.clients,
        snapshotData.vehicles
      )

      setClient(snapshot.client)
      setData(snapshot.vehicles)
    } catch (caughtError) {
      if (isCurrent()) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error(vehiclesLoadError)
        )
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false)
      }
    }
  }, [codPessoa])

  const refetch = React.useCallback(async () => {
    await loadVehicles(() => true, { setLoading: true })
  }, [loadVehicles])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialVehicles() {
      try {
        const snapshotData = await listClientsSnapshot()

        if (!isMounted) {
          return
        }

        const snapshot = resolveClientVehiclesSnapshot(
          codPessoa,
          snapshotData.clients,
          snapshotData.vehicles
        )

        setClient(snapshot.client)
        setData(snapshot.vehicles)
        setError(null)
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error(vehiclesLoadError)
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialVehicles()

    return () => {
      isMounted = false
    }
  }, [codPessoa, loadVehicles])

  return {
    client,
    data,
    error,
    isLoading,
    refetch,
  }
}
