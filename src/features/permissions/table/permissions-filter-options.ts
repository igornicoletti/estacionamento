import { Layers3Icon } from "lucide-react"

import {
  createDataTableFilterOptions,
  type DataTableFilterField,
} from "@/components/data-table"

import { permissionsCopy } from "../constants/permissions-copy"
import { type PermissionTableRow } from "../model/permissions-types"

export function createPermissionsFilterFields(
  data: PermissionTableRow[]
): DataTableFilterField<PermissionTableRow>[] {
  return [
    {
      id: "groupLabel",
      icon: Layers3Icon,
      title: permissionsCopy.filters.groups,
      options: createDataTableFilterOptions(
        data,
        (permission) => permission.groupLabel,
        (permission) => permission.groupLabel
      ),
    },
  ]
}
