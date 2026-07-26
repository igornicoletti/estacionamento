import { DownloadIcon } from "lucide-react"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppPage } from "@/components/shared/app-page"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib"
import { exportRowsToXlsx, type XlsxColumn } from "@/lib/export"

import {
  auditCopy,
  auditScopeLabels,
  auditSeverityLabels,
} from "../constants"
import { useAudit } from "../hooks/use-audit"
import {
  getAuditEventDetails,
  getAuditOutcomeLabel,
  type AuditEvent,
} from "../model"
import { createAuditColumns } from "../table"

const auditExportColumns: readonly XlsxColumn<AuditEvent>[] = [
  { header: auditCopy.table.occurredAt, accessor: (event) => formatDateTime(event.occurredAt) },
  { header: auditCopy.table.responsible, accessor: (event) => event.actorName },
  { header: auditCopy.table.scope, accessor: (event) => auditScopeLabels[event.scope] },
  { header: auditCopy.table.event, accessor: (event) => event.eventLabel },
  { header: auditCopy.table.target, accessor: (event) => event.target || auditCopy.details.emptyValue },
  { header: auditCopy.table.outcome, accessor: (event) => getAuditOutcomeLabel(event) },
  { header: auditCopy.table.severity, accessor: (event) => auditSeverityLabels[event.severity] },
  { header: auditCopy.details.reason, accessor: (event) => event.reason ?? auditCopy.details.emptyValue },
]

export function AuditRoute() {
  const { data: events, error, isLoading, refetch } = useAudit()
  const [selectedEvent, setSelectedEvent] = React.useState<AuditEvent | null>(null)
  const columns = React.useMemo(
    () => createAuditColumns({ onOpenDetails: setSelectedEvent }),
    []
  )

  const responsibleOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.actorName,
        (event) => event.actorName
      ),
    [events]
  )

  const scopeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.scope,
        (event) => auditScopeLabels[event.scope]
      ),
    [events]
  )

  const eventOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.event,
        (event) => event.eventLabel
      ),
    [events]
  )

  const severityOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.severity,
        (event) => auditSeverityLabels[event.severity]
      ),
    [events]
  )

  const handleExport = React.useCallback(() => {
    if (events.length === 0) {
      notify.error(auditCopy.feedback.exportEmptyError)
      return
    }

    try {
      exportRowsToXlsx({
        filename: "auditoria",
        sheetName: "Auditoria",
        columns: auditExportColumns,
        rows: events,
      })

      notify.success(auditCopy.feedback.exportSuccess)
    } catch {
      notify.error(auditCopy.feedback.exportError)
    }
  }, [events])

  return (
    <AppPage
      title={auditCopy.page.title}
      subtitle={auditCopy.page.subtitle}
      actions={
        <Button
          type="button"
          variant="secondary"
          disabled={isLoading || events.length === 0}
          onClick={handleExport}
        >
          <DownloadIcon aria-hidden="true" />
          {auditCopy.actions.exportAll}
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={events}
        getRowId={(event) => event.id}
        globalSearch={{
          columnIds: [
            "actorName",
            "event",
            "eventLabel",
            "target",
            "reason",
            "requestId",
          ],
          placeholder: auditCopy.page.searchPlaceholder,
        }}
        filterFields={[
          {
            id: "actorName",
            title: auditCopy.filters.responsible,
            options: responsibleOptions,
          },
          {
            id: "scope",
            title: auditCopy.filters.scopes,
            options: scopeOptions,
          },
          {
            id: "event",
            title: auditCopy.filters.events,
            options: eventOptions,
          },
          {
            id: "severity",
            title: auditCopy.table.severity,
            options: severityOptions,
          },
        ]}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
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
