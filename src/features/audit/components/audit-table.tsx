import { ScrollTextIcon } from "lucide-react"
import * as React from "react"

import {
  DataTable,
  type DataTableExportConfig,
} from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"

import { auditCopy } from "../constants/audit-copy"
import { AUDIT_TABLE_STATE_KEY } from "../constants/audit-persistence"
import { type AuditEvent } from "../model/audit-types"
import { createAuditColumns } from "../table/audit-columns"
import { createAuditFilterFields } from "../table/audit-filter-options"

interface AuditTableProps {
  data: AuditEvent[]
  error: Error | null
  isLoading: boolean
  onOpenDetails: (event: AuditEvent) => void
  onRetry: () => void
}

const auditExportConfig: DataTableExportConfig<AuditEvent> = {
  filename: "auditoria",
  sheetName: "Auditoria",
  onExportSuccess: () => notify.success(auditCopy.feedback.exportSuccess),
  onExportError: () => notify.error(auditCopy.feedback.exportError),
}

export function AuditTable({
  data,
  error,
  isLoading,
  onOpenDetails,
  onRetry,
}: AuditTableProps) {
  const columns = React.useMemo(
    () => createAuditColumns({ onOpenDetails }),
    [onOpenDetails]
  )
  const filterFields = React.useMemo(
    () => createAuditFilterFields(data),
    [data]
  )

  return (
    <DataTable
      ariaLabel={auditCopy.table.ariaLabel}
      columns={columns}
      data={data}
      defaultColumnVisibility={{
        id: false,
        reason: false,
        requestId: false,
      }}
      tableStateStorageKey={AUDIT_TABLE_STATE_KEY}
      getRowId={(event) => event.id}
      globalSearch={{
        columnIds: ["actor", "event", "target", "reason", "requestId", "id"],
        placeholder: auditCopy.page.searchPlaceholder,
      }}
      filterFields={filterFields}
      emptyState={(
        <AppEmptyState
          media={<ScrollTextIcon aria-hidden="true" />}
          title={auditCopy.empty.title}
          description={auditCopy.empty.description}
        />
      )}
      filteredEmptyState={(
        <AppEmptyState
          media={<ScrollTextIcon aria-hidden="true" />}
          title={auditCopy.filteredEmpty.title}
          description={auditCopy.filteredEmpty.description}
        />
      )}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      enableExport
      exportConfig={auditExportConfig}
      enablePagination
      enableViewOptions
    />
  )
}
