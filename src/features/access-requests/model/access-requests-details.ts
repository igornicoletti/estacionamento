import type { AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord, AccessRequestDetailsTarget } from "./access-requests-types"
import {
  formatAccessRequestReason,
  formatBooleanVerification,
} from "./access-requests-formatters"

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
      label: accessRequestsCopy.tables.recovery.columns.requester,
      value: request.requesterLabel,
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
    {
      label: accessRequestsCopy.details.labels.targetAccount,
      value: request.targetAccountLabel,
    },
    {
      label: accessRequestsCopy.details.labels.contactVerification,
      value: [
        formatBooleanVerification(request.phoneMatchesAccount, {
          matched: accessRequestsCopy.verification.phoneMatched,
          mismatch: accessRequestsCopy.verification.phoneMismatch,
          unverified: accessRequestsCopy.verification.unverified,
        }),
        request.email
          ? formatBooleanVerification(request.emailMatchesAccount, {
              matched: accessRequestsCopy.verification.emailMatched,
              mismatch: accessRequestsCopy.verification.emailMismatch,
              unverified: accessRequestsCopy.verification.unverified,
            })
          : accessRequestsCopy.verification.emailNotProvided,
      ].join(" / "),
    },
  ]
}

export function getAccessRequestDetailsTitle(target: AccessRequestDetailsTarget | null) {
  return target ? "Detalhes da solicitação" : undefined
}

export function getAccessRequestDetailsDescription(target: AccessRequestDetailsTarget | null) {
  return target
    ? "Consulte os dados informados e a verificação da solicitação selecionada."
    : undefined
}

export function getAccessRequestDetailItems(target: AccessRequestDetailsTarget | null) {
  return target ? getRecoveryRequestDetailItems(target.request) : []
}
