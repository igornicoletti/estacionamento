import * as React from "react"

import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"

import { AuditTable } from "../components/audit-table"
import { auditCopy } from "../constants/audit-copy"
import { AUDIT_EVENTS_FETCH_LIMIT } from "../constants/audit-persistence"
import { useAudit } from "../hooks/use-audit"
import { getAuditEventDetails } from "../model/audit-event-details"
import { type AuditEvent } from "../model/audit-types"

export function AuditRoute() {
  const { data, error, isLoading, isTruncated, refetch } = useAudit()
  const [selectedEvent, setSelectedEvent] = React.useState<AuditEvent | null>(
    null
  )
  const openEventDetails = React.useCallback((event: AuditEvent) => {
    setSelectedEvent(event)
  }, [])

  return (
    <AppPage
      title={auditCopy.page.title}
      subtitle={
        isTruncated
          ? auditCopy.page.truncatedSubtitle(AUDIT_EVENTS_FETCH_LIMIT)
          : auditCopy.page.subtitle
      }
    >
      <AuditTable
        data={data}
        error={error}
        isLoading={isLoading}
        onOpenDetails={openEventDetails}
        onRetry={() => {
          void refetch()
        }}
      />

      <AppDetailsSheet
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvent(null)
          }
        }}
        title={selectedEvent ? auditCopy.details.title : undefined}
        description={selectedEvent ? auditCopy.details.description : undefined}
        items={selectedEvent ? getAuditEventDetails(selectedEvent) : []}
      />
    </AppPage>
  )
}
