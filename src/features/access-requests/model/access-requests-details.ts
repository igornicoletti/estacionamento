import type { AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord, AccessRequestDetailsTarget } from "./access-requests-types"
import { formatAccessRequestReason } from "./access-requests-formatters"

function renderValue(value: string | null | undefined) {
  return value ?? accessRequestsCopy.shared.emptyValue
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
      value: formatAccessRequestReason(request.reason, request.description),
    },
    {
      label: accessRequestsCopy.details.labels.phone,
      value: renderValue(request.phoneMasked),
    },
    {
      label: accessRequestsCopy.details.labels.email,
      value: renderValue(request.email),
    },
  ]
}

export function getAccessRequestDetailsTitle(target: AccessRequestDetailsTarget | null) {
  return target ? accessRequestsCopy.details.titleFallback : undefined
}

export function getAccessRequestDetailsDescription(target: AccessRequestDetailsTarget | null) {
  return target ? accessRequestsCopy.details.recoveryDescription : undefined
}

export function getAccessRequestDetailItems(target: AccessRequestDetailsTarget | null) {
  return target ? getRecoveryRequestDetailItems(target.request) : []
}
