import type { AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import type { RecoveryReason } from "@/features/auth"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord, AccessRequestDetailsTarget } from "./access-requests-types"

function renderValue(value: string | null | undefined) {
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

export function getAccessRequestDetailsTitle(target: AccessRequestDetailsTarget | null) {
  if (!target) {
    return accessRequestsCopy.details.titleFallback
  }

  return formatReason(target.request.reason)
}

export function getAccessRequestDetailsDescription(target: AccessRequestDetailsTarget | null) {
  return target ? accessRequestsCopy.details.recoveryDescription : undefined
}

export function getAccessRequestDetailItems(target: AccessRequestDetailsTarget | null) {
  return target ? getRecoveryRequestDetailItems(target.request) : []
}
