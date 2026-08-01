import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import { permissionsCopy } from "../constants/permissions-copy"
import {
  formatPermissionRoles,
  formatPermissionRolesWithoutAccess,
} from "./permissions-models"
import {
  type PermissionRole,
  type PermissionTableRow,
} from "./permissions-types"

function PermissionKeyValue({ value }: { value: string }) {
  return <code className="break-all text-xs">{value}</code>
}

export function getPermissionDetailItems(
  permission: PermissionTableRow,
  roles: readonly PermissionRole[]
): readonly AppDetailsSheetItem[] {
  const rolesWithAccess = formatPermissionRoles(permission.roleKeys, roles)
  const rolesWithoutAccess = formatPermissionRolesWithoutAccess(
    permission.roleKeys,
    roles
  )

  return [
    { label: permissionsCopy.labels.permission, value: permission.label },
    {
      label: permissionsCopy.labels.description,
      value: permission.description || permissionsCopy.labels.emptyValue,
    },
    {
      label: permissionsCopy.labels.key,
      value: <PermissionKeyValue value={permission.key} />,
    },
    { label: permissionsCopy.labels.group, value: permission.groupLabel },
    {
      label: permissionsCopy.labels.rolesWithAccess,
      value: rolesWithAccess.join(", ") || permissionsCopy.labels.noneRole,
    },
    {
      label: permissionsCopy.labels.rolesWithoutAccess,
      value:
        rolesWithoutAccess.join(", ") ||
        permissionsCopy.labels.noRoleWithoutAccess,
    },
  ]
}
