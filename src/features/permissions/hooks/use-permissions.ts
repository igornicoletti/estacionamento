import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { permissionsCopy } from "../content/permissions-copy"
import { listPermissionMatrix } from "../services/permissions-service"
import { type PermissionMatrixRow } from "../types/permissions-types"

export function usePermissions() {
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useAsyncSnapshot<PermissionMatrixRow[]>({
    cacheKey: "permissions:matrix:v2",
    errorMessage: permissionsCopy.error.load,
    initialData: [],
    loadData: listPermissionMatrix,
  })

  return { data, error, isLoading, refetch }
}
