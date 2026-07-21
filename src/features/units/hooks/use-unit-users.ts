import * as React from "react"

import { useUsers, type UserRecord } from "@/features/users"

import { resolveUnitUsersSnapshot } from "../model"

interface UseUnitUsersOptions {
  enabled?: boolean
}

export function useUnitUsers(unitId: string, options: UseUnitUsersOptions = {}) {
  const isEnabled = Boolean(unitId) && (options.enabled ?? true)
  const snapshot = useUsers({ enabled: isEnabled })
  const data = React.useMemo<UserRecord[]>(() => {
    if (!unitId) {
      return []
    }
    return resolveUnitUsersSnapshot(snapshot.data, unitId)
  }, [snapshot.data, unitId])

  return { ...snapshot, data }
}
