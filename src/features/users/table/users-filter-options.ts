import { createDataTableFilterOptions } from "@/components/data-table"

import { usersCopy } from "../constants/users-copy"
import {
  hasRecentUserAccess,
  resolveUnitLabel,
} from "../model/users-models"
import {
  appUserStatusLabels,
  type UserRecord,
  userRoleLabels,
} from "../model/users-types"

export function createUserRecentAccessFilterOptions(
  users: readonly UserRecord[]
) {
  return createDataTableFilterOptions(
    users,
    (user) => (hasRecentUserAccess(user.lastAccessAt) ? "recent" : "not-recent"),
    (user) =>
      hasRecentUserAccess(user.lastAccessAt)
        ? usersCopy.filters.recentAccessValue
        : usersCopy.filters.noRecentAccessValue
  )
}

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
