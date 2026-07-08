import { isGlobalRole } from "@/features/auth"
import { formatDateTime } from "@/lib"

import {
  type CreateUserInput,
  type UserRecord,
} from "../types/users-types"
import { usersCopy } from "../users-copy"

interface NormalizedUnitScope {
  unitId: string | null
  unitName: string | null
}

export interface UnitCatalogItem {
  id: string
  name: string
}

export function resolvePasskeyLabel(value: UserRecord["passkeyStatus"]) {
  return value === "active"
    ? usersCopy.details.passkeyActive
    : usersCopy.details.passkeyInactive
}

export function resolveUnitLabel(unitName: string | null) {
  return unitName || usersCopy.details.globalUnit
}

export function resolveLastAccessLabel(lastAccessAt: string | null) {
  return formatDateTime(lastAccessAt, usersCopy.details.noAccess)
}

export function resolveEmailLabel(email: string | null) {
  return email || usersCopy.details.noEmail
}

export function createNextUserId(users: readonly UserRecord[]) {
  const nextNumber =
    Math.max(
      0,
      ...users.map((user) => Number(user.id.replace("USR-", "")) || 0)
    ) + 1

  return `USR-${String(nextNumber).padStart(3, "0")}`
}

export function normalizeUnitScope(
  input: Pick<CreateUserInput, "role" | "unitId" | "unitName">,
  unitsCatalog: readonly UnitCatalogItem[]
): NormalizedUnitScope {
  if (isGlobalRole(input.role)) {
    return {
      unitId: null,
      unitName: null,
    }
  }

  const normalizedUnitId = input.unitId?.trim() || ""

  if (!normalizedUnitId) {
    throw new Error(usersCopy.errors.requiredUnit)
  }

  const unitMatch = unitsCatalog.find((unit) => unit.id === normalizedUnitId)

  return {
    unitId: normalizedUnitId,
    unitName: unitMatch?.name ?? (input.unitName?.trim() || null),
  }
}

export function interpolateUserCopy(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key: string) => {
    return values[key] ?? match
  })
}
