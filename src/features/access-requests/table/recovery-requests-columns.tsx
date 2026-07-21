import type { ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableSensitiveValue, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getBadgeToneClassName, type BadgeTone } from "@/lib"

import { accessRequestsCopy } from "../constants"
import {
  formatAccessRequestRequester,
  type AccessRecoveryRequestRecord,
  type AccessRequestReviewDecision,
} from "../model"

interface CreateRecoveryRequestsColumnsOptions {
  canReview?: boolean
  onOpenDetails: (request: AccessRecoveryRequestRecord) => void
  onReview: (request: AccessRecoveryRequestRecord, decision: AccessRequestReviewDecision) => void
}

const verificationToneByStatus: Record<
  AccessRecoveryRequestRecord["verificationStatus"],
  BadgeTone | null
> = {
  matched: "success",
  mismatch: "warning",
  unverified: "info",
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
      id: "requesterLabel",
      accessorFn: (request) => request.requesterLabel,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails(row.original)
          }}
        >
          {formatAccessRequestRequester(row.original)}
        </DataTableTextAction>
      ),
      header: accessRequestsCopy.tables.recovery.columns.requester,
      meta: { label: accessRequestsCopy.tables.recovery.columns.requester },
    },
    {
      accessorKey: "targetAccountLabel",
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails(row.original)
          }}
        >
          {row.original.targetAccountLabel}
        </DataTableTextAction>
      ),
      header: accessRequestsCopy.tables.recovery.columns.targetAccount,
      meta: { label: accessRequestsCopy.tables.recovery.columns.targetAccount },
    },
    {
      accessorKey: "reason",
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails(row.original)
          }}
        >
          {row.original.reasonLabel}
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
      accessorKey: "verificationLabel",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(
              verificationToneByStatus[row.original.verificationStatus]
            )}
          >
            {row.original.verificationLabel}
          </Badge>
        </div>
      ),
      enableSorting: false,
      header: () => (
        <div className="text-center font-medium">
          {accessRequestsCopy.tables.recovery.columns.verification}
        </div>
      ),
      meta: { label: accessRequestsCopy.tables.recovery.columns.verification },
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
