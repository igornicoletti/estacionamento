import * as React from "react"

import { useSelectedUnit } from "@/components/shared/app-unit-selector"

import { type ReportsSnapshot } from "../model/reports-types"
import { getReportsSnapshotByUnitId } from "../services/reports-service"

export function useReportsSnapshot() {
  const { isLoading: isLoadingSelectedUnit, selectedUnitId } = useSelectedUnit()
  const [data, setData] = React.useState<ReportsSnapshot | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const selectedUnitIdRef = React.useRef(selectedUnitId)

  React.useEffect(() => {
    selectedUnitIdRef.current = selectedUnitId
  })

  const refetch = React.useCallback(async () => {
    if (!selectedUnitIdRef.current) {
      setData(null)
      setError("Ative o pátio de uma unidade para visualizar os relatórios.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await getReportsSnapshotByUnitId(
        selectedUnitIdRef.current,
      )
      setData(snapshot)
    } catch {
      setError("Não foi possível carregar os dados de relatórios.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      if (isLoadingSelectedUnit) {
        setIsLoading(true)
        return
      }

      if (!selectedUnitIdRef.current) {
        setData(null)
        setError("Ative o pátio de uma unidade para visualizar os relatórios.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const snapshot = await getReportsSnapshotByUnitId(
          selectedUnitIdRef.current,
        )
        if (!cancelled) setData(snapshot)
      } catch {
        if (!cancelled)
          setError("Não foi possível carregar os dados de relatórios.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [isLoadingSelectedUnit, selectedUnitId])

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}
