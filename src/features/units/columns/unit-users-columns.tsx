import { type ColumnDef } from "@tanstack/react-table"

import {
  appUserStatusLabels,
  userRoleLabels,
} from "@/features/auth"
import {
  resolveLastAccessLabel,
  resolveMfaLabel,
} from "@/features/users/utils/users-models"
import { type UserRecord } from "@/features/users"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"
import { unitsCopy } from "../units-copy"

function getUserDetails(user: UserRecord) {
  return {
    title: user.name,
    description: user.email || unitsCopy.table.noEmail,
    items: [
      { label: "Nome", value: user.name },
      { label: "CPF", value: user.cpf },
      { label: unitsCopy.table.email, value: user.email || "-" },
      { label: unitsCopy.table.phone, value: user.phoneMasked || "-" },
      { label: unitsCopy.table.profile, value: userRoleLabels[user.role] },
      { label: unitsCopy.table.status, value: appUserStatusLabels[user.status] },
      { label: unitsCopy.table.mfa, value: resolveMfaLabel(user.mfaStatus) },
      { label: unitsCopy.table.lastAccess, value: resolveLastAccessLabel(user.lastAccessAt) },
    ],
  }
}

export function createUnitUsersColumns(): ColumnDef<UserRecord>[] {
  const detailsAction = createDataTableDetailsAction<UserRecord>((row) =>
    getUserDetails(row.original)
  )

  return [
    {
      accessorKey: "name",
      meta: { label: "Nome" },
      header: "Nome",
      cell: ({ row }) => (
        <DataTableDetails
          {...getUserDetails(row.original)}
          trigger={
            <DataTableDetailsTextTrigger>
              {row.original.name}
            </DataTableDetailsTextTrigger>
          }
        />
      ),
    },
    {
      accessorKey: "cpf",
      meta: { label: "CPF" },
      header: "CPF",
    },
    {
      accessorKey: "email",
      meta: { label: unitsCopy.table.email },
      header: unitsCopy.table.email,
      cell: ({ row }) => row.original.email || "-",
    },
    {
      accessorKey: "phoneMasked",
      meta: { label: unitsCopy.table.phone },
      header: unitsCopy.table.phone,
      cell: ({ row }) => row.original.phoneMasked || "-",
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
      header: () => (
        <div className="text-center">
          {unitsCopy.table.status}
        </div>
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.status === "active"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isActive ? "success" : undefined)}
            >
              {appUserStatusLabels[row.original.status]}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "mfaStatus",
      meta: { label: unitsCopy.table.mfa },
      header: () => (
        <div className="text-center">
          {unitsCopy.table.mfa}
        </div>
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.mfaStatus === "active"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isActive ? "success" : undefined)}
            >
              {resolveMfaLabel(row.original.mfaStatus)}
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
    createActionsColumn<UserRecord>([detailsAction]),
  ]
}
