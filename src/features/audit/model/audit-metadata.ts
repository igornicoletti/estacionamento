import { formatDateTime } from "@/lib"

import { auditCopy } from "../constants"
import { getAuditOutcomeLabel } from "./audit-outcome"
import {
  auditScopeLabels,
  auditSeverityLabels,
  type AuditEvent,
  type AuditEventDetailItem,
} from "./audit-types"
import { humanizeAuditIdentifier } from "./audit-event-labels"

const auditMetadataLabels: Readonly<Record<string, string>> = auditCopy.metadata.labels
const auditMetadataValueLabels: Readonly<Record<string, string>> =
  auditCopy.metadata.values
const hiddenAuditMetadataKeys = new Set(["registeredBy", "runId", "source"])

function formatAuditMetadataValue(value: unknown) {
  if (typeof value === "string") {
    const mappedValue = auditMetadataValueLabels[value]

    if (mappedValue) {
      return mappedValue
    }

    if (/^[a-z][a-z0-9_.-]*$/i.test(value)) {
      return humanizeAuditIdentifier(value)
    }

    return value.replace(/[<>]/g, "")
  }

  if (typeof value === "number") {
    return Intl.NumberFormat("pt-BR").format(value)
  }

  if (typeof value === "boolean") {
    return value ? auditCopy.labels.yes : auditCopy.labels.no
  }

  return null
}

function getAuditMetadataDetails(event: AuditEvent): AuditEventDetailItem[] {
  if (!event.metadata) {
    return []
  }

  return Object.entries(event.metadata).flatMap(([key, value]) => {
    if (hiddenAuditMetadataKeys.has(key) || !(key in auditMetadataLabels)) {
      return []
    }

    const formattedValue = formatAuditMetadataValue(value)

    return formattedValue
      ? [{ id: `metadata-${key}`, label: auditMetadataLabels[key], value: formattedValue }]
      : []
  })
}

export function getAuditEventDetails(event: AuditEvent): AuditEventDetailItem[] {
  return [
    {
      id: "occurredAt",
      label: auditCopy.table.occurredAt,
      value: formatDateTime(event.occurredAt),
    },
    { id: "actorName", label: auditCopy.table.responsible, value: event.actorName },
    { id: "scope", label: auditCopy.table.scope, value: auditScopeLabels[event.scope] },
    { id: "event", label: auditCopy.table.event, value: event.eventLabel },
    {
      id: "target",
      label: auditCopy.table.target,
      value: event.target || auditCopy.details.emptyValue,
    },
    { id: "outcome", label: auditCopy.table.outcome, value: getAuditOutcomeLabel(event) },
    {
      id: "severity",
      label: auditCopy.table.severity,
      value: auditSeverityLabels[event.severity],
    },
    {
      id: "reason",
      label: auditCopy.details.reason,
      value: event.reason ?? auditCopy.details.emptyValue,
    },
    ...getAuditMetadataDetails(event),
  ]
}
