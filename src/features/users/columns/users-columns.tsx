import { type ColumnDef } from "@tanstack/react-table"

import {
  appUserStatusLabels,
  userRoleLabels,
} from "@/features/auth"
import { getBadgeToneClassName } from "@/lib"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

import { type UserRecord } from "../types/users-types"
import { usersCopy } from "../users-copy"
import {
  resolveEmailLabel,
  resolveLastAccessLabel,
  resolveMfaLabel,
  resolveUnitLabel,
} from "../utils/users-models"

interface CreateUsersColumnsOptions {
  onEditUser?: (user: UserRecord) => void
  onBlockUser?: (user: UserRecord) => void
  onResetAccess?: (user: UserRecord) => void
  onResetPasskey?: (user: UserRecord) => void
  onClearLock?: (user: UserRecord) => void
  onRevokeSessions?: (user: UserRecord) => void
  remoteMode?: boolean
}

function resolveStatusBadgeVariant(status: UserRecord["status"]) {
  if (status === "active") {
    return "success" as const
  }

  if (status === "inactive") {
    return undefined
  }

  if (status === "pending") {
    return "info" as const
  }

  return "warning" as const
}

function getUserDetails(user: UserRecord) {
  return {
    title: user.name,
    description: resolveEmailLabel(user.email),
    items: [
      { label: usersCopy.form.fields.name, value: user.name },
      { label: usersCopy.form.fields.cpf, value: user.cpf },
      { label: usersCopy.form.fields.email, value: user.email || "—" },
      { label: usersCopy.form.fields.phone, value: user.phoneMasked || "—" },
      { label: usersCopy.form.roleLabel, value: userRoleLabels[user.role] },
      { label: usersCopy.filters.status, value: appUserStatusLabels[user.status] },
      { label: usersCopy.form.unitLabel, value: resolveUnitLabel(user.unitName) },
      { label: "MFA", value: resolveMfaLabel(user.mfaStatus) },
      { label: "Último acesso", value: resolveLastAccessLabel(user.lastAccessAt) },
    ],
  }
}

export function createUsersColumns(
  options: CreateUsersColumnsOptions = {}
): ColumnDef<UserRecord>[] {
  const detailsAction = createDataTableDetailsAction<UserRecord>((row) =>
    getUserDetails(row.original)
  )

  return [
    {
      accessorKey: "name",
      meta: { label: usersCopy.form.fields.name },
      header: usersCopy.form.fields.name,
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
      accessorKey: "email",
      meta: { label: usersCopy.form.fields.email },
      header: usersCopy.form.fields.email,
      cell: ({ row }) => row.original.email || "—",
    },
    {
      accessorKey: "cpf",
      meta: { label: usersCopy.form.fields.cpf },
      header: usersCopy.form.fields.cpf,
    },
    {
      accessorKey: "phoneMasked",
      meta: { label: usersCopy.form.fields.phone },
      header: usersCopy.form.fields.phone,
      cell: ({ row }) => row.original.phoneMasked || "—",
    },
    {
      accessorKey: "role",
      meta: { label: usersCopy.form.roleLabel },
      header: usersCopy.form.roleLabel,
      cell: ({ row }) => userRoleLabels[row.original.role],
    },
    {
      accessorKey: "status",
      meta: { label: usersCopy.filters.status },
      header: () => (
        <div className="text-center text-[0.8rem] font-medium">
          {usersCopy.filters.status}
        </div>
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(resolveStatusBadgeVariant(row.original.status))}
          >
            {appUserStatusLabels[row.original.status]}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "unitName",
      meta: { label: usersCopy.form.unitLabel },
      header: usersCopy.form.unitLabel,
      cell: ({ row }) => resolveUnitLabel(row.original.unitName),
    },
    {
      accessorKey: "mfaStatus",
      meta: { label: "MFA" },
      header: () => <div className="text-center text-[0.8rem] font-medium">MFA</div>,
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
      meta: { label: "Último acesso" },
      header: "Último acesso",
      cell: ({ row }) => resolveLastAccessLabel(row.original.lastAccessAt),
    },
    createActionsColumn<UserRecord>((row) => {
      const isActive = row.original.status === "active"
      const isBlocked = row.original.status === "inactive"

      return [
        detailsAction,
        {
          id: "edit" as const,
          label: usersCopy.actions.edit,
          onSelect: (row: { original: UserRecord }) => {
            options.onEditUser?.(row.original)
          },
        },
        {
          id: "reset-access",
          label: usersCopy.actions.resetPassword,
          onSelect: (row) => {
            options.onResetAccess?.(row.original)
          },
        },
        ...(options.remoteMode
          ? [
            {
              id: "reset-passkey" as const,
              label: usersCopy.actions.resetPasskey,
              onSelect: (row: { original: UserRecord }) => {
                options.onResetPasskey?.(row.original)
              },
            },
            // "Remover bloqueio" only makes sense for users currently
            // blocked; it toggles back to "block" for active users.
            ...(isBlocked
              ? [
                {
                  id: "clear-lock" as const,
                  label: usersCopy.actions.clearLock,
                  onSelect: (row: { original: UserRecord }) => {
                    options.onClearLock?.(row.original)
                  },
                },
              ]
              : []),
            {
              id: "revoke-sessions" as const,
              label: usersCopy.actions.revokeSessions,
              onSelect: (row: { original: UserRecord }) => {
                options.onRevokeSessions?.(row.original)
              },
            },
          ]
          : []),
        ...(isActive
          ? [
            {
              id: "block" as const,
              label: usersCopy.actions.blockUser,
              variant: "destructive" as const,
              onSelect: (row: { original: UserRecord }) => {
                options.onBlockUser?.(row.original)
              },
            },
          ]
          : []),
      ]
    }),
  ]
}
