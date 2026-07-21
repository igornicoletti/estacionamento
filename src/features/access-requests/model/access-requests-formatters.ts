import type { RecoveryReason } from "@/features/auth"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord } from "./access-requests-types"

export function formatAccessRequestReason(
  reason: RecoveryReason,
  description?: string | null
) {
  if (reason === "other" && description?.trim()) {
    return description.trim()
  }

  return accessRequestsCopy.reasonLabels[reason]
}

export function formatAccessRequestRequester(
  request: Pick<AccessRecoveryRequestRecord, "email" | "phoneMasked">
) {
  return request.email ?? request.phoneMasked ?? accessRequestsCopy.shared.emptyValue
}
