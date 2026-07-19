import * as React from "react"

import { createDataTableFilterOptions } from "@/components/data-table"

import { permissionSourceLabels } from "../constants"
import {
  permissionSourceValues,
  type PermissionMatrixRow,
} from "../model"

export function usePermissionsTableFilters(
  permissions: readonly PermissionMatrixRow[]
) {
  const groupOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        permissions,
        (permission) => permission.groupLabel,
        (permission) => permission.groupLabel
      ),
    [permissions]
  )

  const sourceOptions = React.useMemo(
    () =>
      permissionSourceValues.map((source) => {
        const count = permissions.filter(
          (permission) => permission.source === source
        ).length

        return {
          count,
          label: permissionSourceLabels[source],
          value: source,
        }
      }),
    [permissions]
  )

  return { groupOptions, sourceOptions }
}
