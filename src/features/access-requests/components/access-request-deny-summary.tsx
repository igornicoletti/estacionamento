import type { AccessRecoveryRequestRecord } from "../model"
import { accessRequestsCopy } from "../constants"

interface AccessRequestDenySummaryProps {
  request: AccessRecoveryRequestRecord
}

export function AccessRequestDenySummary({ request }: AccessRequestDenySummaryProps) {
  return (
    <div className="grid gap-1 px-4 text-sm">
      <span className="font-medium text-foreground">{accessRequestsCopy.reasonLabels[request.reason]}</span>
      <span className="text-muted-foreground">{request.phoneMasked}</span>
    </div>
  )
}
