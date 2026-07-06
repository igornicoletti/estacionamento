import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { listPermissionMatrix } from "../services/permissions-service"
import { type PermissionMatrixRow } from "../types/permissions-types"

const permissionsLoadError =
  "Não foi possível carregar a matriz de perfis e permissões."

export function usePermissions() {
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useAsyncSnapshot<PermissionMatrixRow[]>({
    cacheKey: "permissions:matrix",
    initialData: [],
    loadData: listPermissionMatrix,
    errorMessage: permissionsLoadError,
  })

  return { data, error, isLoading, refetch }
}
