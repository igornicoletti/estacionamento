import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  type AccessRequestReviewDecision,
  type PendingPhoneChangeRequestRecord,
} from "../types/access-requests-types"

interface CreatePhoneChangeRequestsColumnsOptions {
  canReview?: boolean
  onOpenDetails: (request: PendingPhoneChangeRequestRecord) => void
  onReview: (
    request: PendingPhoneChangeRequestRecord,
    decision: AccessRequestReviewDecision
  ) => void
}

export function createPhoneChangeRequestsColumns({
  canReview = true,
  onOpenDetails,
  onReview,
}: CreatePhoneChangeRequestsColumnsOptions): ColumnDef<PendingPhoneChangeRequestRecord>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: accessRequestsCopy.tables.phoneChanges.columns.name },
      header: accessRequestsCopy.tables.phoneChanges.columns.name,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails(row.original)
          }}
        >
          {row.original.name}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "currentPhoneMasked",
      meta: { label: accessRequestsCopy.tables.phoneChanges.columns.currentPhone },
      header: accessRequestsCopy.tables.phoneChanges.columns.currentPhone,
      cell: ({ row }) =>
        row.original.currentPhoneMasked || accessRequestsCopy.shared.emptyValue,
    },
    {
      accessorKey: "pendingPhoneMasked",
      meta: { label: accessRequestsCopy.tables.phoneChanges.columns.pendingPhone },
      header: accessRequestsCopy.tables.phoneChanges.columns.pendingPhone,
    },
    {
      accessorKey: "requestedAt",
      meta: { label: accessRequestsCopy.tables.phoneChanges.columns.requestedAt },
      header: accessRequestsCopy.tables.phoneChanges.columns.requestedAt,
      cell: ({ row }) => formatDateTime(row.original.requestedAt),
    },
    createActionsColumn<PendingPhoneChangeRequestRecord>([
      {
        id: "details",
        label: accessRequestsCopy.actions.details,
        onSelect: (row) => {
          onOpenDetails(row.original)
        },
      },
      ...(canReview
        ? [
          {
            id: "approve-phone-change" as const,
            label: accessRequestsCopy.actions.approve,
            onSelect: (row: { original: PendingPhoneChangeRequestRecord }) => {
              onReview(row.original, "approved")
            },
          },
          {
            id: "deny-phone-change" as const,
            label: accessRequestsCopy.actions.deny,
            variant: "destructive" as const,
            onSelect: (row: { original: PendingPhoneChangeRequestRecord }) => {
              onReview(row.original, "denied")
            },
          },
        ]
        : []),
    ]),
  ]
}
