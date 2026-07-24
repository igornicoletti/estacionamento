import * as React from "react"

import { listPermissionMatrix } from "../services/permissions-service"
import { type PermissionMatrixRow } from "../types/permissions-types"

const permissionsLoadError =
  "Não foi possível carregar a matriz de perfis e permissões."

function toLoadError(caughtError: unknown) {
  return caughtError instanceof Error
    ? caughtError
    : new Error(permissionsLoadError)
}

export function usePermissions() {
  const [data, setData] = React.useState<PermissionMatrixRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const refetch = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const matrix = await listPermissionMatrix()

      setData(matrix)
    } catch (caughtError) {
      setError(toLoadError(caughtError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialPermissions() {
      try {
        const matrix = await listPermissionMatrix()

        if (isMounted) {
          setData(matrix)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(toLoadError(caughtError))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialPermissions()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}
