import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { permissionsCopy } from "../constants"
import { type PermissionMatrixRow } from "../model"
import { listPermissionMatrix } from "../services"

export function usePermissions() {
  const { data, error, isLoading, refetch } = useAsyncSnapshot<PermissionMatrixRow[]>({
    cacheKey: "permissions:matrix:v3",
    errorMessage: permissionsCopy.error.load,
    initialData: [],
    loadData: listPermissionMatrix,
  })

  return { data, error, isLoading, refetch }
}
