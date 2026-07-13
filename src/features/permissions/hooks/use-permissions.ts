import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { permissionsCopy } from "../permissions-copy"
import { listPermissionMatrix } from "../services/permissions-service"
import { type PermissionMatrixRow } from "../types/permissions-types"

export function usePermissions() {
  const { data, error, isLoading, refetch } = useAsyncSnapshot<PermissionMatrixRow[]>({
    cacheKey: "permissions:matrix:v3",
    errorMessage: permissionsCopy.error.load,
    initialData: [],
    loadData: listPermissionMatrix,
  })

  return { data, error, isLoading, refetch }
}
