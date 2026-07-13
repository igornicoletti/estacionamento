import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  type AccessRecoveryRequestRecord,
  type AccessRequestReviewDecision,
} from "../types/access-requests-types"

interface CreateRecoveryRequestsColumnsOptions {
  onOpenDetails: (request: AccessRecoveryRequestRecord) => void
  onReview: (
    request: AccessRecoveryRequestRecord,
    decision: AccessRequestReviewDecision
  ) => void
}

export function createRecoveryRequestsColumns({
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
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-left font-medium"
          onClick={() => {
            onOpenDetails(row.original)
          }}
        >
          {accessRequestsCopy.reasonLabels[row.original.reason]}
        </Button>
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
      {
        id: "approve-recovery",
        label: accessRequestsCopy.actions.approve,
        onSelect: (row) => {
          onReview(row.original, "approved")
        },
      },
      {
        id: "deny-recovery",
        label: accessRequestsCopy.actions.deny,
        variant: "destructive",
        onSelect: (row) => {
          onReview(row.original, "denied")
        },
      },
    ]),
  ]
}
