import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import { formatDateTime } from "@/lib"

import { usersCopy } from "../constants/users-copy"
import {
  appUserStatusLabels,
  isGlobalRole,
  userRoleLabels,
  type CreateUserInput,
  type UnitCatalogItem,
  type UserRecord,
} from "./users-types"

export function resolvePasskeyLabel(value: UserRecord["passkeyStatus"]) {
  return value === "active"
    ? usersCopy.details.passkeyActive
    : usersCopy.details.passkeyInactive
}

export function resolveUnitLabel(unitName: string | null) {
  return unitName?.trim() || usersCopy.details.globalUnit
}

export function resolveLastAccessLabel(lastAccessAt: string | null) {
  return formatDateTime(lastAccessAt, usersCopy.details.noAccess)
}

const ONLINE_THRESHOLD_MS = 15 * 60 * 1000

export function hasRecentUserAccess(lastAccessAt: string | null) {
  if (!lastAccessAt) {
    return false
  }

  const lastAccess = new Date(lastAccessAt).getTime()

  if (Number.isNaN(lastAccess)) {
    return false
  }

  return Date.now() - lastAccess <= ONLINE_THRESHOLD_MS
}

export function resolveRecentAccessLabel(lastAccessAt: string | null) {
  return hasRecentUserAccess(lastAccessAt)
    ? usersCopy.filters.recentAccessValue
    : usersCopy.filters.noRecentAccessValue
}

export function resolveEmailLabel(email: string | null) {
  return email || usersCopy.details.noEmail
}

export function resolveCanonicalUnitId(
  input: Pick<CreateUserInput, "role" | "unitId">,
  unitsCatalog: readonly UnitCatalogItem[]
): string | null {
  if (isGlobalRole(input.role)) {
    return null
  }

  const normalizedUnitId = input.unitId?.trim() || ""

  if (!normalizedUnitId) {
    throw new Error(usersCopy.errors.requiredUnit)
  }

  const unitMatch = unitsCatalog.find((unit) => unit.id === normalizedUnitId)

  if (!unitMatch) {
    throw new Error(usersCopy.errors.invalidUnit)
  }

  return unitMatch.id
}

export function interpolateUserCopy(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key: string) => {
    return values[key] ?? match
  })
}

export function getUserDetailItems(user: UserRecord): readonly AppDetailsSheetItem[] {
  return [
    { label: usersCopy.form.fields.name, value: user.name },
    { label: usersCopy.form.fields.cpf, value: user.cpf },
    { label: usersCopy.form.fields.email, value: resolveEmailLabel(user.email) },
    {
      label: usersCopy.form.fields.phone,
      value: user.phoneMasked || usersCopy.details.emptyValue,
    },
    { label: usersCopy.form.roleLabel, value: userRoleLabels[user.role] },
    { label: usersCopy.filters.status, value: appUserStatusLabels[user.status] },
    { label: usersCopy.form.unitLabel, value: resolveUnitLabel(user.unitName) },
    {
      label: usersCopy.details.passkeyLabel,
      value: resolvePasskeyLabel(user.passkeyStatus),
    },
    {
      label: usersCopy.details.lastAccessLabel,
      value: resolveLastAccessLabel(user.lastAccessAt),
    },
    {
      label: usersCopy.filters.recentAccess,
      value: resolveRecentAccessLabel(user.lastAccessAt),
    },
  ]
}
