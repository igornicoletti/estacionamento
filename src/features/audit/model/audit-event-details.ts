import { formatDateTime } from "@/lib"

import { auditCopy } from "../constants/audit-copy"
import {
  auditScopeLabels,
  auditSeverityLabels,
} from "../constants/audit-labels"
import { getAuditEventLabel } from "./audit-event-labels"
import { getAuditOutcomeLabel } from "./audit-outcome"
import {
  formatAuditDisplayText,
  formatAuditMetadataValue,
  getAuditEntityLabel,
} from "./audit-presentation"
import {
  type AuditEvent,
  type AuditEventDetailItem,
} from "./audit-types"

const auditMetadataLabels: Readonly<Record<string, string>> =
  auditCopy.metadata.labels

function getAuditMetadataDetails(event: AuditEvent): AuditEventDetailItem[] {
  if (!event.metadata) {
    return []
  }

  return Object.entries(event.metadata).flatMap(([key, value]) => {
    const label = auditMetadataLabels[key]

    if (!label) {
      return []
    }

    const formattedValue = formatAuditMetadataValue(value)

    return formattedValue
      ? [{ id: `metadata-${key}`, label, value: formattedValue }]
      : []
  })
}

export function getAuditEventDetails(event: AuditEvent): AuditEventDetailItem[] {
  return [
    {
      id: "id",
      label: auditCopy.details.eventId,
      value: event.id,
    },
    {
      id: "requestId",
      label: auditCopy.details.requestId,
      value: event.requestId ?? auditCopy.details.emptyValue,
    },
    {
      id: "occurredAt",
      label: auditCopy.table.occurredAt,
      value: formatDateTime(event.occurredAt),
    },
    {
      id: "actor",
      label: auditCopy.table.responsible,
      value: getAuditEntityLabel(event.actor),
    },
    {
      id: "scope",
      label: auditCopy.table.scope,
      value: auditScopeLabels[event.scope],
    },
    {
      id: "event",
      label: auditCopy.table.event,
      value: getAuditEventLabel(event.event),
    },
    {
      id: "target",
      label: auditCopy.table.target,
      value: getAuditEntityLabel(event.target) || auditCopy.details.emptyValue,
    },
    {
      id: "outcome",
      label: auditCopy.table.outcome,
      value: getAuditOutcomeLabel(event),
    },
    {
      id: "severity",
      label: auditCopy.table.severity,
      value: auditSeverityLabels[event.severity],
    },
    {
      id: "reason",
      label: auditCopy.details.reason,
      value: event.reason
        ? formatAuditDisplayText(event.reason)
        : auditCopy.details.emptyValue,
    },
    ...getAuditMetadataDetails(event),
  ]
}
