import * as React from "react"

import {
  listClients,
  listClientVehicles,
} from "../services/clients-service"
import {
  type Client,
  type ClientVehicle,
} from "../types/clients-types"

const vehiclesLoadError = "Nao foi possivel carregar os veiculos do cliente."

export function useClientVehicles(codPessoa: number) {
  const [data, setData] = React.useState<ClientVehicle[]>([])
  const [client, setClient] = React.useState<Client | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const loadVehicles = React.useCallback(async (isCurrent: () => boolean) => {
    try {
      setIsLoading(true)
      setError(null)

      const [clients, vehicles] = await Promise.all([
        listClients(),
        listClientVehicles(),
      ])

      if (!isCurrent()) {
        return
      }

      setClient(
        clients.find((currentClient) => currentClient.cod_pessoa === codPessoa) ??
          null
      )
      setData(
        vehicles.filter((vehicle) => vehicle.cod_pessoa === codPessoa)
      )
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
    await loadVehicles(() => true)
  }, [loadVehicles])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialVehicles() {
      try {
        const [clients, vehicles] = await Promise.all([
          listClients(),
          listClientVehicles(),
        ])

        if (!isMounted) {
          return
        }

        setClient(
          clients.find((currentClient) => currentClient.cod_pessoa === codPessoa) ??
            null
        )
        setData(
          vehicles.filter((vehicle) => vehicle.cod_pessoa === codPessoa)
        )
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
  }, [codPessoa])

  return {
    client,
    data,
    error,
    isLoading,
    refetch,
  }
}
