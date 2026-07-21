import { recoveryReasonValues, type RecoveryReason } from "@/features/auth"
import { formatPhone, isValidPhone, onlyDigits } from "@/lib"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord } from "./access-requests-types"
import {
  formatAccessRequestReason,
  formatAccessRequestRequester,
} from "./access-requests-formatters"

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

function normalizePhoneDisplay(...values: readonly (string | null)[]) {
  for (const value of values) {
    if (!value) {
      continue
    }

    if (isValidPhone(value)) {
      return formatPhone(value)
    }

    const digits = onlyDigits(value)

    if (value.includes("*") && digits.length >= 4) {
      return value
    }
  }

  return null
}

export function normalizeRecoveryRequest(value: unknown): AccessRecoveryRequestRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const createdAt = readString(value.created_at)
  const id = readString(value.id)
  const phoneMasked = normalizePhoneDisplay(
    readString(value.phone_display),
    readString(value.phone_masked)
  )
  const reason = isRecoveryReason(value.reason) ? value.reason : null

  if (!createdAt || !id || !reason) {
    return null
  }

  const description = readString(value.description)
  const email = readString(value.email)
  const reasonLabel = formatAccessRequestReason(reason, description)
  const baseRecord = {
    createdAt,
    description,
    email,
    id,
    phoneMasked,
    reason,
    reasonLabel,
  }

  return {
    ...baseRecord,
    requesterLabel: formatAccessRequestRequester(baseRecord),
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
