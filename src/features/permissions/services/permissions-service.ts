import {
  hasCapability,
  userRoleValues,
} from "@/features/auth"

import { type PermissionMatrixRow } from "../types/permissions-types"
import {
  formatRolesWithAccess,
  listPermissionCapabilityDescriptors,
} from "../utils/permissions-matrix-model"

function buildPermissionMatrixRow(
  descriptor: ReturnType<typeof listPermissionCapabilityDescriptors>[number]
): PermissionMatrixRow {
  const { capability, group, groupLabel, label } = descriptor
  const roles = userRoleValues.filter((role) => hasCapability(role, capability))

  return {
    capability,
    label,
    group,
    groupLabel,
    roles: [...roles],
    roleLabels: formatRolesWithAccess(roles),
    roleCount: roles.length,
  }
}

export function buildPermissionMatrix(): PermissionMatrixRow[] {
  return listPermissionCapabilityDescriptors().map(buildPermissionMatrixRow)
}

export async function listPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  await Promise.resolve()

  return buildPermissionMatrix()
}
