import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  type AccessRecoveryRequestRecord,
  type AccessRequestReviewDecision,
} from "../types/access-requests-types"

interface CreateRecoveryRequestsColumnsOptions {
  canReview?: boolean
  onOpenDetails: (request: AccessRecoveryRequestRecord) => void
  onReview: (
    request: AccessRecoveryRequestRecord,
    decision: AccessRequestReviewDecision
  ) => void
}

export function createRecoveryRequestsColumns({
  canReview = true,
  onOpenDetails,
  onReview,
}: CreateRecoveryRequestsColumnsOptions): ColumnDef<AccessRecoveryRequestRecord>[] {
  return [
    {
      accessorKey: "createdAt",
      meta: { label: accessRequestsCopy.tables.recovery.columns.createdAt },
      header: accessRequestsCopy.tables.recovery.columns.createdAt,
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      accessorKey: "reason",
      meta: { label: accessRequestsCopy.tables.recovery.columns.reason },
      header: accessRequestsCopy.tables.recovery.columns.reason,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails(row.original)
          }}
        >
          {accessRequestsCopy.reasonLabels[row.original.reason]}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "phoneMasked",
      meta: { label: accessRequestsCopy.tables.recovery.columns.phone },
      header: accessRequestsCopy.tables.recovery.columns.phone,
    },
    {
      accessorKey: "email",
      meta: { label: accessRequestsCopy.tables.recovery.columns.email },
      header: accessRequestsCopy.tables.recovery.columns.email,
      cell: ({ row }) => row.original.email || accessRequestsCopy.shared.emptyValue,
    },
    {
      accessorKey: "description",
      meta: { label: accessRequestsCopy.tables.recovery.columns.description },
      header: accessRequestsCopy.tables.recovery.columns.description,
      cell: ({ row }) =>
        row.original.description || accessRequestsCopy.shared.emptyValue,
    },
    createActionsColumn<AccessRecoveryRequestRecord>([
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
            id: "approve-recovery" as const,
            label: accessRequestsCopy.actions.approve,
            onSelect: (row: { original: AccessRecoveryRequestRecord }) => {
              onReview(row.original, "approved")
            },
          },
          {
            id: "deny-recovery" as const,
            label: accessRequestsCopy.actions.deny,
            variant: "destructive" as const,
            onSelect: (row: { original: AccessRecoveryRequestRecord }) => {
              onReview(row.original, "denied")
            },
          },
        ]
        : []),
    ]),
  ]
}
