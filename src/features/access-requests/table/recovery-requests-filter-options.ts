import { createDataTableFilterOptions } from "@/components/data-table"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord } from "../model"

export function createRecoveryReasonFilterOptions(
  requests: readonly AccessRecoveryRequestRecord[]
) {
  return createDataTableFilterOptions(
    requests,
    (request) => request.reason,
    (request) => accessRequestsCopy.reasonLabels[request.reason]
  )
}
