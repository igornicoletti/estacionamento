import * as React from "react"
import { useUsers } from "@/features/users"
import { resolveUnitUsersSnapshot } from "../utils/units-models"

export function useUnitUsers(unitId: string, options: { enabled?: boolean } = {}) {
  const snapshot = useUsers(options)
  const data = React.useMemo(
    () => resolveUnitUsersSnapshot(snapshot.data, unitId),
    [snapshot.data, unitId]
  )

  return { ...snapshot, data }
}
