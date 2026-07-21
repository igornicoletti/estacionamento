import { recoveryReasonValues, type RecoveryReason } from "@/features/auth"
import { resolveVisibleSensitiveValue } from "@/lib"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord } from "./access-requests-types"

type UnknownRecord = Record<PropertyKey, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function isRecoveryReason(value: unknown): value is RecoveryReason {
  return recoveryReasonValues.some((reason) => reason === value)
}

export function normalizeRecoveryRequest(value: unknown): AccessRecoveryRequestRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const createdAt = readString(value.created_at)
  const id = readString(value.id)
  const phoneMasked =
    resolveVisibleSensitiveValue(readString(value.phone_display), readString(value.phone_masked)) ??
    accessRequestsCopy.shared.unavailableSensitiveValue
  const reason = isRecoveryReason(value.reason) ? value.reason : null

  if (!createdAt || !id || !phoneMasked || !reason) {
    return null
  }

  return {
    createdAt,
    description: readString(value.description),
    email: readString(value.email),
    id,
    phoneMasked,
    reason,
  }
}

export function normalizeRecoveryRequests(value: unknown): AccessRecoveryRequestRecord[] {
  if (!Array.isArray(value)) {
    throw new Error(accessRequestsCopy.feedback.invalidResponse)
  }

  return value.reduce<AccessRecoveryRequestRecord[]>((result, item) => {
    const normalized = normalizeRecoveryRequest(item)

    if (normalized) {
      result.push(normalized)
    }

    return result
  }, [])
}
