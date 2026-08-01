import { type ColumnDef } from "@tanstack/react-table"

import {
  createActionsColumn,
  DataTableSensitiveValue,
  DataTableStackedCell,
  DataTableTextAction,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { cn, getBadgeToneClassName } from "@/lib"

import { usersCopy } from "../constants/users-copy"
import {
  hasRecentUserAccess,
  resolveEmailLabel,
  resolveLastAccessLabel,
  resolveRecentAccessLabel,
  resolvePasskeyLabel,
  resolveUnitLabel,
} from "../model/users-models"
import {
  appUserStatusLabels,
  type UserRecord,
  userRoleLabels,
} from "../model/users-types"
import {
  createUserRowActions,
  type UsersTableActionOptions,
} from "./users-row-actions"
import { USER_RECENT_ACCESS_COLUMN_ID } from "./users-table-ids"

export type CreateUsersColumnsOptions = UsersTableActionOptions

function resolveStatusBadgeTone(status: UserRecord["status"]) {
  if (status === "active") return "success" as const
  if (status === "pending") return "info" as const
  if (status === "password_reset" || status === "passkey_reset") {
    return "warning" as const
  }

  return undefined
}

function CenteredHeader({ children }: { children: string }) {
  return <div className="text-center">{children}</div>
}

export function createUsersColumns(
  options: CreateUsersColumnsOptions = {}
): ColumnDef<UserRecord>[] {
  return [
    {
      accessorKey: "name",
      meta: { label: usersCopy.form.fields.name },
      header: usersCopy.form.fields.name,
      cell: ({ row }) => {
        const user = row.original
        const recentAccessLabel = resolveRecentAccessLabel(user.lastAccessAt)
        const content = (
          <span className="inline-flex items-center gap-2">
            <span
              className={cn(
                "inline-block size-2 shrink-0 rounded-full",
                hasRecentUserAccess(user.lastAccessAt)
                  ? "bg-success"
                  : "bg-muted-foreground/40"
              )}
              aria-hidden="true"
            />
            <span>{user.name}</span>
            <span className="sr-only">({recentAccessLabel})</span>
          </span>
        )

        return options.onViewUserDetails ? (
          <DataTableTextAction
            onClick={() => options.onViewUserDetails?.(user)}
          >
            {content}
          </DataTableTextAction>
        ) : (
          content
        )
      },
    },
    {
      accessorKey: "email",
      meta: { label: usersCopy.form.fields.email },
      header: usersCopy.form.fields.email,
      cell: ({ row }) => resolveEmailLabel(row.original.email),
    },
    {
      accessorKey: "cpf",
      meta: { label: usersCopy.form.fields.cpf },
      header: usersCopy.form.fields.cpf,
      cell: ({ row }) => (
        <DataTableSensitiveValue value={row.original.cpf} kind="cpf" />
      ),
    },
    {
      accessorKey: "phoneMasked",
      meta: { label: usersCopy.form.fields.phone },
      header: usersCopy.form.fields.phone,
      cell: ({ row }) => (
        <DataTableSensitiveValue
          value={row.original.phoneMasked}
          kind="phone"
          fallback={usersCopy.details.emptyValue}
        />
      ),
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
        <CenteredHeader>{usersCopy.filters.status}</CenteredHeader>
      ),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(
              resolveStatusBadgeTone(row.original.status)
            )}
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
      accessorKey: "passkeyStatus",
      meta: { label: usersCopy.details.passkeyLabel },
      header: () => (
        <CenteredHeader>{usersCopy.details.passkeyLabel}</CenteredHeader>
      ),
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.passkeyStatus === "active"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(
                isActive ? "success" : undefined
              )}
            >
              {resolvePasskeyLabel(row.original.passkeyStatus)}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "lastAccessAt",
      meta: { label: usersCopy.details.lastAccessLabel },
      header: usersCopy.details.lastAccessLabel,
      cell: ({ row }) => (
        <DataTableStackedCell
          primary={resolveLastAccessLabel(row.original.lastAccessAt)}
          secondary={
            row.original.authUserId
              ? undefined
              : usersCopy.details.localUser
          }
        />
      ),
    },
    {
      id: USER_RECENT_ACCESS_COLUMN_ID,
      accessorFn: (user) =>
        hasRecentUserAccess(user.lastAccessAt) ? "recent" : "not-recent",
      meta: { label: usersCopy.filters.recentAccess },
      header: () => (
        <CenteredHeader>{usersCopy.filters.recentAccess}</CenteredHeader>
      ),
      enableHiding: true,
      enableSorting: false,
      cell: ({ row }) => {
        const hasRecentAccess =
          row.getValue<string>(USER_RECENT_ACCESS_COLUMN_ID) === "recent"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(
                hasRecentAccess ? "success" : undefined
              )}
            >
              {hasRecentAccess
                ? usersCopy.filters.recentAccessValue
                : usersCopy.filters.noRecentAccessValue}
            </Badge>
          </div>
        )
      },
    },
    createActionsColumn<UserRecord>((row) =>
      createUserRowActions(row.original, options)
    ),
  ]
}
