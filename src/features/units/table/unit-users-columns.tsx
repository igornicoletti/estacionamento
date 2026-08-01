import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableSensitiveValue, DataTableTextAction } from "@/components/data-table"
import { AppStatusBadge } from "@/components/shared"
import {
  appUserStatusLabels,
  resolveLastAccessLabel,
  resolvePasskeyLabel,
  type UserRecord,
  userRoleLabels,
} from "@/features/users"

import { unitsCopy } from "../constants/units-copy"

interface CreateUnitUsersColumnsOptions {
  onOpenDetails: (user: UserRecord) => void
}

function resolveUserStatusTone(status: UserRecord["status"]) {
  if (status === "active") return "success" as const
  if (status === "inactive") return "secondary" as const
  if (status === "pending") return "info" as const
  return "warning" as const
}

function resolveCpfValue(user: UserRecord) {
  return user.cpf || unitsCopy.details.emptyValue
}

function resolveEmailValue(user: UserRecord) {
  return user.email || unitsCopy.table.noEmail
}

function resolvePhoneValue(user: UserRecord) {
  return user.phoneMasked || unitsCopy.details.emptyValue
}

export function createUnitUsersColumns(
  options: CreateUnitUsersColumnsOptions
): ColumnDef<UserRecord>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: unitsCopy.table.name },
      header: unitsCopy.table.name,
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onOpenDetails(row.original)}>
          {row.original.name}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "cpf",
      meta: {
        label: unitsCopy.table.cpf,
        exportValue: (_value, row) => resolveCpfValue(row),
      },
      header: unitsCopy.table.cpf,
      cell: ({ row }) => (
        <DataTableSensitiveValue
          value={resolveCpfValue(row.original)}
          kind="cpf"
          fallback={unitsCopy.details.emptyValue}
        />
      ),
    },
    {
      accessorKey: "email",
      meta: {
        label: unitsCopy.table.email,
        exportValue: (_value, row) => resolveEmailValue(row),
      },
      header: unitsCopy.table.email,
      cell: ({ row }) => resolveEmailValue(row.original),
    },
    {
      accessorKey: "phoneMasked",
      meta: {
        label: unitsCopy.table.phone,
        exportValue: (_value, row) => resolvePhoneValue(row),
      },
      header: unitsCopy.table.phone,
      cell: ({ row }) => (
        <DataTableSensitiveValue
          value={resolvePhoneValue(row.original)}
          kind="phone"
          canReveal
          fallback={unitsCopy.details.emptyValue}
        />
      ),
    },
    {
      accessorKey: "role",
      meta: {
        label: unitsCopy.table.profile,
        exportValue: (_value, row) => userRoleLabels[row.role],
      },
      header: unitsCopy.table.profile,
      cell: ({ row }) => userRoleLabels[row.original.role],
    },
    {
      accessorKey: "status",
      enableSorting: false,
      meta: {
        label: unitsCopy.table.status,
        exportValue: (_value, row) => appUserStatusLabels[row.status],
      },
      header: () => <div className="text-center">{unitsCopy.table.status}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <AppStatusBadge tone={resolveUserStatusTone(row.original.status)}>
            {appUserStatusLabels[row.original.status]}
          </AppStatusBadge>
        </div>
      ),
    },
    {
      accessorKey: "passkeyStatus",
      enableSorting: false,
      meta: {
        label: unitsCopy.table.passkey,
        exportValue: (_value, row) => resolvePasskeyLabel(row.passkeyStatus),
      },
      header: () => <div className="text-center">{unitsCopy.table.passkey}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <AppStatusBadge
            tone={row.original.passkeyStatus === "active" ? "success" : "secondary"}
          >
            {resolvePasskeyLabel(row.original.passkeyStatus)}
          </AppStatusBadge>
        </div>
      ),
    },
    {
      accessorKey: "lastAccessAt",
      meta: {
        label: unitsCopy.table.lastAccess,
        exportValue: (_value, row) => resolveLastAccessLabel(row.lastAccessAt),
      },
      header: unitsCopy.table.lastAccess,
      cell: ({ row }) => resolveLastAccessLabel(row.original.lastAccessAt),
    },
    createActionsColumn<UserRecord>([
      {
        id: "details",
        label: unitsCopy.actions.details,
        onSelect: (row) => options.onOpenDetails(row.original),
      },
    ]),
  ]
}
