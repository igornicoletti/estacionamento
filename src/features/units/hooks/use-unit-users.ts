import * as React from "react"

import { listUsers, type UserRecord } from "@/features/users"
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { listUnits } from "../services/units-service"
import { type Unit } from "../types/units-types"
import { unitsCopy } from "../units-copy"
import { resolveUnitUsersSnapshot } from "../utils/units-models"

const unitUsersLoadError = unitsCopy.errors.unitUsersLoad

export function useUnitUsers(unitId: string) {
  const loadSnapshot = React.useCallback(async () => {
    const [units, users] = await Promise.all([listUnits(), listUsers()])
    return resolveUnitUsersSnapshot(unitId, units, users)
  }, [unitId])

  const {
    data: snapshot,
    error,
    isLoading,
    refetch,
  } = useAsyncSnapshot<{ unit: Unit | null; data: UserRecord[] }>({
    cacheKey: `units:${unitId || "unknown"}:users`,
    initialData: { unit: null, data: [] },
    loadData: loadSnapshot,
    errorMessage: unitUsersLoadError,
  })

  return {
    data: snapshot.data,
    unit: snapshot.unit,
    error,
    isLoading,
    refetch,
  }
}
