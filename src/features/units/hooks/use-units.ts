import * as React from "react"

import {
  buildUnitYardConfigMap,
  resolveUnitYardConfig,
  type Unit,
  type UnitUserStats,
  type UnitYardConfig,
} from "../model"
import {
  listUnitUserStats,
  listUnitYardConfigs,
  listUnits,
} from "../services"
import { type UnitTableRow } from "../table"

const unitsLoadError = "Não foi possível carregar as unidades."

export function useUnits() {
  const [data, setData] = React.useState<UnitTableRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const loadUnits = React.useCallback(async (isCurrent: () => boolean) => {
    try {
      setIsLoading(true)
      setError(null)

      const units = await listUnitTableRows()

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
        const units = await listUnitTableRows()

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
  }, [])

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}

async function listUnitTableRows() {
  const [units, userStats, yardConfigs] = await Promise.all([
    listUnits(),
    listUnitUserStats().catch(() => new Map<string, UnitUserStats>()),
    listUnitYardConfigs().catch(() => [] as UnitYardConfig[]),
  ])
  const yardConfigMap = buildUnitYardConfigMap(yardConfigs)

  return units.map((unit) => mapUnitToTableRow(unit, userStats, yardConfigMap))
}

function mapUnitToTableRow(
  unit: Unit,
  userStats: ReadonlyMap<string, UnitUserStats>,
  yardConfigMap: ReadonlyMap<string, UnitYardConfig>
): UnitTableRow {
  const unitId = String(unit.cod_empresa)

  return {
    ...unit,
    userStats: userStats.get(unitId) ?? {
      managers: 0,
      operators: 0,
    },
    yardConfig: resolveUnitYardConfig(unitId, yardConfigMap),
  }
}
