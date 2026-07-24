import * as React from "react"

import { listUnits } from "../services/units-service"
import { type Unit } from "../types/units-types"

const unitsLoadError = "Não foi possível carregar as unidades."

export function useUnits() {
  const [data, setData] = React.useState<Unit[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const loadUnits = React.useCallback(async (isCurrent: () => boolean) => {
    try {
      setIsLoading(true)
      setError(null)

      const units = await listUnits()

      if (isCurrent()) {
        setData(units)
      }
    } catch (caughtError) {
      if (isCurrent()) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error(unitsLoadError)
        )
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false)
      }
    }
  }, [])

  const refetch = React.useCallback(() => {
    return loadUnits(() => true)
  }, [loadUnits])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialUnits() {
      try {
        const units = await listUnits()

        if (isMounted) {
          setData(units)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error(unitsLoadError)
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialUnits()

    return () => {
      isMounted = false
    }
  }, [loadUnits])

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}
