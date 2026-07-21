import { createDataTableFilterOptions } from "@/components/data-table"

import {
  appUserStatusLabels,
  isUserOnline,
  resolveUnitLabel,
  type UserRecord,
  userRoleLabels,
} from "../model"

export function createUserOnlineFilterOptions(users: readonly UserRecord[]) {
  return createDataTableFilterOptions(
    users,
    (user) => (isUserOnline(user.lastAccessAt) ? "online" : "offline"),
    (user) => (isUserOnline(user.lastAccessAt) ? "Online" : "Offline")
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
