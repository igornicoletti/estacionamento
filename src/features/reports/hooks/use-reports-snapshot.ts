import * as React from "react"

import { useWorkspaceUnit } from "@/features/workspace"

import { type ReportsSnapshot } from "../model/reports-types"
import { getReportsSnapshotByUnitId } from "../services/reports-service"

export function useReportsSnapshot() {
  const { selectedUnitId } = useWorkspaceUnit()
  const [data, setData] = React.useState<ReportsSnapshot | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refetch = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await getReportsSnapshotByUnitId(selectedUnitId)
      setData(snapshot)
    } catch {
      setError("Não foi possível carregar os dados de relatórios.")
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
