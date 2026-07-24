import * as React from "react"

import { listClients } from "../services/clients-service"
import { type Client } from "../types/clients-types"

const clientsLoadError = "Nao foi possivel carregar os clientes."

export function useClients() {
  const [data, setData] = React.useState<Client[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const loadClients = React.useCallback(async (isCurrent: () => boolean) => {
    try {
      setIsLoading(true)
      setError(null)

      const clients = await listClients()

      if (isCurrent()) {
        setData(clients)
      }
    } catch (caughtError) {
      if (isCurrent()) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error(clientsLoadError)
        )
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false)
      }
    }
  }, [])

  const refetch = React.useCallback(() => {
    return loadClients(() => true)
  }, [loadClients])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialClients() {
      try {
        const clients = await listClients()

        if (isMounted) {
          setData(clients)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error(clientsLoadError)
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialClients()

    return () => {
      isMounted = false
    }
  }, [loadClients])

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}
