import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { appUserStatusLabels, userRoleLabels, type UserRecord } from "@/features/users/types/users-types"
import { resolveLastAccessLabel, resolvePasskeyLabel } from "@/features/users/utils/users-models"
import { getBadgeToneClassName } from "@/lib"
import { unitsCopy } from "../units-copy"

interface CreateUnitUsersColumnsOptions {
  onOpenDetails: (user: UserRecord) => void
}

export function createUnitUsersColumns(options: CreateUnitUsersColumnsOptions): ColumnDef<UserRecord>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: "Nome" },
      header: "Nome",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-left font-medium"
          onClick={() => options.onOpenDetails(row.original)}
        >
          {row.original.name}
        </Button>
      ),
    },
    { accessorKey: "cpf", meta: { label: "CPF" }, header: "CPF" },
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
      cell: ({ row }) => row.original.phoneMasked || "—",
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
        label: "Detalhes",
        onSelect: (row) => options.onOpenDetails(row.original),
      },
    ]),
  ]
}
