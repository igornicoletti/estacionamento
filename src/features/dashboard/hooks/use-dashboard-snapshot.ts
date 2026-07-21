import * as React from "react"

import { useSelectedUnit } from "@/components/shared/app-unit-selector"

import { type DashboardDataSnapshot } from "../model/dashboard-types"
import { getDashboardSnapshotByUnitId } from "../services/dashboard-service"

export function useDashboardSnapshot() {
  const { selectedUnitId } = useSelectedUnit()
  const [data, setData] = React.useState<DashboardDataSnapshot | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const selectedUnitIdRef = React.useRef(selectedUnitId)

  React.useEffect(() => {
    selectedUnitIdRef.current = selectedUnitId
  })

  const refetch = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await getDashboardSnapshotByUnitId(selectedUnitIdRef.current)
      setData(snapshot)
    } catch {
      setError("Não foi possível carregar os dados do dashboard.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const snapshot = await getDashboardSnapshotByUnitId(selectedUnitIdRef.current)
        if (!cancelled) setData(snapshot)
      } catch {
        if (!cancelled) setError("Não foi possível carregar os dados do dashboard.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => { cancelled = true }
  }, [selectedUnitId])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
