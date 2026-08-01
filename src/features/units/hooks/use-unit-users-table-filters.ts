import { CircleDotIcon, ShieldCheckIcon } from "lucide-react"
import * as React from "react"

import { createDataTableFilterOptions, type DataTableFilterField } from "@/components/data-table"
import { appUserStatusLabels, type UserRecord, userRoleLabels } from "@/features/users"

import { unitsCopy } from "../constants/units-copy"

export function useUnitUsersTableFilters(users: readonly UserRecord[]) {
  const roleOptions = React.useMemo(
    () => createDataTableFilterOptions(users, (user) => user.role, (user) => userRoleLabels[user.role]),
    [users]
  )
  const statusOptions = React.useMemo(
    () => createDataTableFilterOptions(users, (user) => user.status, (user) => appUserStatusLabels[user.status]),
    [users]
  )

  return [
    {
      id: "role",
      icon: ShieldCheckIcon,
      title: unitsCopy.filters.roles,
      options: roleOptions,
    },
    {
      id: "status",
      icon: CircleDotIcon,
      title: unitsCopy.filters.status,
      options: statusOptions,
    },
  ] satisfies readonly DataTableFilterField<UserRecord>[]
}
