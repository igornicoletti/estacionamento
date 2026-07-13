import {
  recoveryReasonValues,
  type RecoveryReason,
} from "@/features/auth"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  type AccessRecoveryRequestRecord,
  type PendingPhoneChangeRequestRecord,
} from "../types/access-requests-types"

type UnknownRecord = Record<PropertyKey, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null
}

function isRecoveryReason(value: unknown): value is RecoveryReason {
  return recoveryReasonValues.some((reason) => reason === value)
}

export function parseRecoveryRequest(
  value: unknown
): AccessRecoveryRequestRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value.id)
  const createdAt = readString(value.created_at)
  const phoneMasked = readString(value.phone_masked)
  const reason = isRecoveryReason(value.reason) ? value.reason : null

  if (!id || !createdAt || !phoneMasked || !reason) {
    return null
  }

  return {
    createdAt,
    description: readNullableString(value.description),
    email: readNullableString(value.email),
    id,
    phoneMasked,
    reason,
  }
}

export function parsePhoneChangeRequest(
  value: unknown
): PendingPhoneChangeRequestRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const authUserId = readString(value.auth_user_id)
  const id = readString(value.id)
  const name = readString(value.name)
  const pendingPhoneMasked = readString(value.pending_phone_masked)
  const requestedAt = readString(value.updated_at)

  if (!authUserId || !id || !name || !pendingPhoneMasked || !requestedAt) {
    return null
  }

  return {
    authUserId,
    currentPhoneMasked: readNullableString(value.phone_masked),
    id,
    name,
    pendingPhoneMasked,
    requestedAt,
  }
}

export function parseRecoveryRequests(
  value: unknown
): AccessRecoveryRequestRecord[] {
  if (!Array.isArray(value)) {
    throw new Error(accessRequestsCopy.feedback.invalidResponse)
  }

  const requests = value.map(parseRecoveryRequest)

  if (requests.some((request) => request === null)) {
    throw new Error(accessRequestsCopy.feedback.invalidResponse)
  }

  return requests.filter(
    (request): request is AccessRecoveryRequestRecord => request !== null
  )
}

export function parsePhoneChangeRequests(
  value: unknown
): PendingPhoneChangeRequestRecord[] {
  if (!Array.isArray(value)) {
    throw new Error(accessRequestsCopy.feedback.invalidResponse)
  }

  const requests = value.map(parsePhoneChangeRequest)

  if (requests.some((request) => request === null)) {
    throw new Error(accessRequestsCopy.feedback.invalidResponse)
  }

  return requests.filter(
    (request): request is PendingPhoneChangeRequestRecord => request !== null
  )
}
