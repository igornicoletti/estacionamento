import { createDataTableFilterOptions } from "@/components/data-table"

import {
  appUserStatusLabels,
  resolveUnitLabel,
  type UserRecord,
  userRoleLabels,
} from "../model"

export function createUserRoleFilterOptions(users: readonly UserRecord[]) {
  return createDataTableFilterOptions(
    users,
    (user) => user.role,
    (user) => userRoleLabels[user.role]
  )
}

export function createUserStatusFilterOptions(users: readonly UserRecord[]) {
  return createDataTableFilterOptions(
    users,
    (user) => user.status,
    (user) => appUserStatusLabels[user.status]
  )
}

export function createUserUnitFilterOptions(users: readonly UserRecord[]) {
  return createDataTableFilterOptions(
    users,
    (user) => user.unitName ?? "",
    (user) => resolveUnitLabel(user.unitName),
    {
      emptyOption: {
        label: resolveUnitLabel(null),
        value: "",
      },
    }
  )
}
