import {
  getSupabaseBrowserClient,
  getValidatedSupabaseAccessToken,
} from "@/lib"

import { permissionsCopy } from "../constants"
import {
  assertPermissionRowsAreValid,
  buildPermissionGroupsFromRows,
  buildPermissionMatrixFromRows,
  parsePermissionMatrixResponse,
  parseRawPermission,
  parseRawRolePermission,
  type PermissionMatrixRow,
  type RawPermissionRow,
  type RawRolePermissionRow,
} from "../model"

async function listPermissionMatrixDirect(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>
) {
  const [permissionsResponse, rolesResponse] = await Promise.all([
    supabase
      .from("app_permissions")
      .select("key, label, description")
      .order("label", { ascending: true }),
    supabase
      .from("app_role_permissions")
      .select("permission_key, role_key"),
  ])

  if (permissionsResponse.error || rolesResponse.error) {
    throw new Error(permissionsCopy.error.load, {
      cause: permissionsResponse.error ?? rolesResponse.error,
    })
  }

  const permissions = (permissionsResponse.data ?? []).map(parseRawPermission)
  const rolePermissions = (rolesResponse.data ?? []).map(parseRawRolePermission)

  assertPermissionRowsAreValid({ permissions, rolePermissions })

  const validPermissions = permissions.filter(
    (permission): permission is RawPermissionRow => Boolean(permission)
  )
  const validRolePermissions = rolePermissions.filter(
    (rolePermission): rolePermission is RawRolePermissionRow =>
      Boolean(rolePermission)
  )

  return buildPermissionMatrixFromRows({
    groups: buildPermissionGroupsFromRows(validPermissions),
    permissions: validPermissions,
    rolePermissions: validRolePermissions,
  })
}

export async function listPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(permissionsCopy.error.unavailable)
  }

  const accessToken = await getValidatedSupabaseAccessToken(supabase)

  if (!accessToken) {
    return listPermissionMatrixDirect(supabase)
  }

  try {
    const matrixResponse = await supabase.functions.invoke("list-permission-matrix", {
      body: {},
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (matrixResponse.error) {
      throw new Error(permissionsCopy.error.load, { cause: matrixResponse.error })
    }

    return parsePermissionMatrixResponse(matrixResponse.data).permissions
  } catch (error) {
    try {
      return await listPermissionMatrixDirect(supabase)
    } catch {
      throw error instanceof Error
        ? error
        : new Error(permissionsCopy.error.load, { cause: error })
    }
  }
}
