import * as React from "react"

import { useUsers, type UserRecord } from "@/features/users"

import { resolveUnitUsersSnapshot } from "../model"

export function useUnitUsers(unitId: string, options: { enabled?: boolean } = {}) {
  const snapshot = useUsers(options)
  const data = React.useMemo<UserRecord[]>(
    () => resolveUnitUsersSnapshot(snapshot.data, unitId),
    [snapshot.data, unitId]
  )

  return { ...snapshot, data }
}
