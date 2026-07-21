import type { ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableSensitiveValue, DataTableTextAction } from "@/components/data-table"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../constants"
import type { AccessRecoveryRequestRecord, AccessRequestReviewDecision } from "../model"

interface CreateRecoveryRequestsColumnsOptions {
  canReview?: boolean
  onOpenDetails: (request: AccessRecoveryRequestRecord) => void
  onReview: (request: AccessRecoveryRequestRecord, decision: AccessRequestReviewDecision) => void
}

export function createRecoveryRequestsColumns({
  canReview = true,
  onOpenDetails,
  onReview,
}: CreateRecoveryRequestsColumnsOptions): ColumnDef<AccessRecoveryRequestRecord>[] {
  return [
    {
      accessorKey: "createdAt",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
      header: accessRequestsCopy.tables.recovery.columns.createdAt,
      meta: { label: accessRequestsCopy.tables.recovery.columns.createdAt },
    },
    {
      accessorKey: "reason",
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails(row.original)
          }}
        >
          {accessRequestsCopy.reasonLabels[row.original.reason]}
        </DataTableTextAction>
      ),
      header: accessRequestsCopy.tables.recovery.columns.reason,
      meta: { label: accessRequestsCopy.tables.recovery.columns.reason },
    },
    {
      accessorKey: "phoneMasked",
      header: accessRequestsCopy.tables.recovery.columns.phone,
      meta: { label: accessRequestsCopy.tables.recovery.columns.phone },
      cell: ({ row }) => (
        <DataTableSensitiveValue
          value={row.original.phoneMasked}
          kind="phone"
          fallback={accessRequestsCopy.shared.emptyValue}
        />
      ),
    },
    {
      accessorKey: "email",
      cell: ({ row }) => row.original.email || accessRequestsCopy.shared.emptyValue,
      header: accessRequestsCopy.tables.recovery.columns.email,
      meta: { label: accessRequestsCopy.tables.recovery.columns.email },
    },
    {
      accessorKey: "description",
      cell: ({ row }) => row.original.description || accessRequestsCopy.shared.emptyValue,
      header: accessRequestsCopy.tables.recovery.columns.description,
      meta: { label: accessRequestsCopy.tables.recovery.columns.description },
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
              onSelect: (row: { original: AccessRecoveryRequestRecord }) => {
                onReview(row.original, "denied")
              },
              variant: "destructive" as const,
            },
          ]
        : []),
    ]),
  ]
}
