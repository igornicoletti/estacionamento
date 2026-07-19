import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import {
  appUserStatusLabels,
  resolveLastAccessLabel,
  resolvePasskeyLabel,
  type UserRecord,
  userRoleLabels,
} from "@/features/users"
import { getBadgeToneClassName } from "@/lib"

import { unitsCopy } from "../constants"

interface CreateUnitUsersColumnsOptions {
  onOpenDetails: (user: UserRecord) => void
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
      meta: { label: unitsCopy.table.cpf },
      header: unitsCopy.table.cpf,
      cell: ({ row }) => row.original.cpf || unitsCopy.details.emptyValue,
    },
    {
      accessorKey: "email",
      meta: { label: unitsCopy.table.email },
      header: unitsCopy.table.email,
      cell: ({ row }) => row.original.email || unitsCopy.table.noEmail,
    },
    {
      accessorKey: "phoneMasked",
      meta: { label: unitsCopy.table.phone },
      header: unitsCopy.table.phone,
      cell: ({ row }) => row.original.phoneMasked || unitsCopy.details.emptyValue,
    },
    {
      accessorKey: "role",
      meta: { label: unitsCopy.table.profile },
      header: unitsCopy.table.profile,
      cell: ({ row }) => userRoleLabels[row.original.role],
    },
    {
      accessorKey: "status",
      meta: { label: unitsCopy.table.status },
      header: () => <div className="text-center">{unitsCopy.table.status}</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.status === "active"

        return (
          <div className="flex justify-center">
            <Badge variant="secondary" className={getBadgeToneClassName(isActive ? "success" : undefined)}>
              {appUserStatusLabels[row.original.status]}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "passkeyStatus",
      meta: { label: unitsCopy.table.passkey },
      header: () => <div className="text-center">{unitsCopy.table.passkey}</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.passkeyStatus === "active"

        return (
          <div className="flex justify-center">
            <Badge variant="secondary" className={getBadgeToneClassName(isActive ? "success" : undefined)}>
              {resolvePasskeyLabel(row.original.passkeyStatus)}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "lastAccessAt",
      meta: { label: unitsCopy.table.lastAccess },
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
