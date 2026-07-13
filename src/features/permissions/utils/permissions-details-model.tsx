import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import { permissionsCopy } from "../permissions-copy"
import {
  permissionSourceLabels,
  type PermissionMatrixRow,
} from "../types/permissions-types"
import { formatPermissionRolesWithoutAccess } from "./permissions-model"

function PermissionKeyValue({ value }: { value: string }) {
  return <code className="break-all text-xs">{value}</code>
}

export function getPermissionDetailItems(
  permission: PermissionMatrixRow
): readonly AppDetailsSheetItem[] {
  return [
    {
      label: permissionsCopy.labels.key,
      value: <PermissionKeyValue value={permission.key} />,
    },
    { label: permissionsCopy.labels.group, value: permission.groupLabel },
    {
      label: permissionsCopy.labels.source,
      value: permissionSourceLabels[permission.source],
    },
    {
      label: permissionsCopy.labels.critical,
      value: permission.isCritical ? permissionsCopy.labels.yes : permissionsCopy.labels.no,
    },
    { label: permissionsCopy.labels.rolesWithAccess, value: permission.roleLabels },
    {
      label: permissionsCopy.labels.rolesWithoutAccess,
      value: formatPermissionRolesWithoutAccess(permission.roles),
    },
  ]
}
