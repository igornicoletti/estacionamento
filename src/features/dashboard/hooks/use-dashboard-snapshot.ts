import * as React from "react"

import { useWorkspaceUnit } from "@/features/workspace"

import { type DashboardDataSnapshot } from "../model/dashboard-types"
import { getDashboardSnapshotByUnitId } from "../services/dashboard-service"

export function useDashboardSnapshot() {
  const { selectedUnitId } = useWorkspaceUnit()
  const [data, setData] = React.useState<DashboardDataSnapshot | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refetch = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await getDashboardSnapshotByUnitId(selectedUnitId)
      setData(snapshot)
    } catch {
      setError("Não foi possível carregar os dados do dashboard.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedUnitId])

  React.useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
