import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import { type RecoveryReason } from "@/features/auth"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  type AccessRecoveryRequestRecord,
  type AccessRequestDetailsTarget,
  type PendingPhoneChangeRequestRecord,
} from "../types/access-requests-types"

function renderValue(value: string | number | null | undefined) {
  return value ?? accessRequestsCopy.shared.emptyValue
}

function formatReason(reason: RecoveryReason) {
  return accessRequestsCopy.reasonLabels[reason]
}

export function getRecoveryRequestDetailItems(
  request: AccessRecoveryRequestRecord
): readonly AppDetailsSheetItem[] {
  return [
    {
      label: accessRequestsCopy.details.labels.id,
      value: request.id,
    },
    {
      label: accessRequestsCopy.details.labels.createdAt,
      value: formatDateTime(request.createdAt),
    },
    {
      label: accessRequestsCopy.details.labels.reason,
      value: formatReason(request.reason),
    },
    {
      label: accessRequestsCopy.details.labels.phone,
      value: request.phoneMasked,
    },
    {
      label: accessRequestsCopy.details.labels.email,
      value: renderValue(request.email),
    },
    {
      label: accessRequestsCopy.details.labels.description,
      value: renderValue(request.description),
    },
  ]
}

export function getPhoneChangeRequestDetailItems(
  request: PendingPhoneChangeRequestRecord
): readonly AppDetailsSheetItem[] {
  return [
    {
      label: accessRequestsCopy.details.labels.id,
      value: request.id,
    },
    {
      label: accessRequestsCopy.details.labels.userId,
      value: request.authUserId,
    },
    {
      label: accessRequestsCopy.details.labels.name,
      value: request.name,
    },
    {
      label: accessRequestsCopy.details.labels.currentPhone,
      value: renderValue(request.currentPhoneMasked),
    },
    {
      label: accessRequestsCopy.details.labels.pendingPhone,
      value: request.pendingPhoneMasked,
    },
    {
      label: accessRequestsCopy.details.labels.requestedAt,
      value: formatDateTime(request.requestedAt),
    },
  ]
}

export function getAccessRequestDetailsTitle(
  target: AccessRequestDetailsTarget | null
) {
  if (!target) {
    return accessRequestsCopy.details.titleFallback
  }

  return target.type === "recovery"
    ? formatReason(target.request.reason)
    : target.request.name
}

export function getAccessRequestDetailsDescription(
  target: AccessRequestDetailsTarget | null
) {
  if (!target) {
    return undefined
  }

  return target.type === "recovery"
    ? accessRequestsCopy.details.recoveryDescription
    : accessRequestsCopy.details.phoneDescription
}

export function getAccessRequestDetailItems(
  target: AccessRequestDetailsTarget | null
) {
  if (!target) {
    return []
  }

  return target.type === "recovery"
    ? getRecoveryRequestDetailItems(target.request)
    : getPhoneChangeRequestDetailItems(target.request)
}
