import { auditCopy } from "../constants"
import { type AuditEvent, type AuditSeverity } from "./audit-types"

export function resolveAuditOutcomeVariant(event: AuditEvent) {
  if (event.success) {
    return "success" as const
  }

  return event.severity === "warning" ? "warning" as const : "destructive" as const
}

export function resolveAuditSeverityVariant(severity: AuditSeverity) {
  if (severity === "critical") {
    return "warning" as const
  }

  if (severity === "warning") {
    return "warning" as const
  }

  return "info" as const
}

export function getAuditOutcomeLabel(event: AuditEvent) {
  if (event.success) {
    return auditCopy.labels.success
  }

  return auditCopy.labels.failure
}
