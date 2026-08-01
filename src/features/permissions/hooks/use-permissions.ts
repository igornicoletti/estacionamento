import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { permissionsCopy } from "../constants/permissions-copy"
import { type PermissionMatrix } from "../model/permissions-types"
import { listPermissionMatrix } from "../services/permissions-service"

const emptyPermissionMatrix: PermissionMatrix = {
  permissions: [],
  roles: [],
}

export function usePermissions() {
  return useAsyncSnapshot({
    errorMessage: permissionsCopy.error.load,
    initialData: emptyPermissionMatrix,
    loadData: listPermissionMatrix,
  })
}
