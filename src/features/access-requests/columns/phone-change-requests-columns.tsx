import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn } from "@/components/data-table"
import { formatDateTime } from "@/lib"

import { accessRequestsCopy } from "../access-requests-copy"
import {
  type AccessRequestReviewDecision,
  type PendingPhoneChangeRequestRecord,
} from "../types/access-requests-types"

interface CreatePhoneChangeRequestsColumnsOptions {
  onReview: (
    request: PendingPhoneChangeRequestRecord,
    decision: AccessRequestReviewDecision
  ) => void
}

export function createPhoneChangeRequestsColumns({
  onReview,
}: CreatePhoneChangeRequestsColumnsOptions): ColumnDef<PendingPhoneChangeRequestRecord>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: accessRequestsCopy.tables.phoneChanges.columns.name },
      header: accessRequestsCopy.tables.phoneChanges.columns.name,
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
        id: "approve-phone-change",
        label: accessRequestsCopy.actions.approve,
        onSelect: (row) => {
          onReview(row.original, "approved")
        },
      },
      {
        id: "deny-phone-change",
        label: accessRequestsCopy.actions.deny,
        variant: "destructive",
        onSelect: (row) => {
          onReview(row.original, "denied")
        },
      },
    ]),
  ]
}
