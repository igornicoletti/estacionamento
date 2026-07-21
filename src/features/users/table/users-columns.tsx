import { type ColumnDef, type Row } from "@tanstack/react-table"

import {
  createActionsColumn,
  DataTableSensitiveValue,
  DataTableStackedCell,
  DataTableTextAction,
  type DataTableRowAction,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { usersCopy } from "../constants"
import {
  appUserStatusLabels,
  isUserOnline,
  resolveEmailLabel,
  resolveLastAccessLabel,
  resolveOnlineLabel,
  resolvePasskeyLabel,
  resolveUnitLabel,
  userRoleLabels,
  type UserRecord,
} from "../model"

interface CreateUsersColumnsOptions {
  canEditUser?: boolean
  canBlockUser?: boolean
  canResetPassword?: boolean
  canResetPasskey?: boolean
  canClearLock?: boolean
  canRevokeSessions?: boolean
  canManageOwnerUser?: boolean
  currentAuthUserId?: string | null
  onViewUserDetails?: (user: UserRecord) => void
  onEditUser?: (user: UserRecord) => void
  onBlockUser?: (user: UserRecord) => void
  onResetAccess?: (user: UserRecord) => void
  onResetPasskey?: (user: UserRecord) => void
  onClearLock?: (user: UserRecord) => void
  onRevokeSessions?: (user: UserRecord) => void
  remoteMode?: boolean
}

function resolveStatusBadgeTone(status: UserRecord["status"]) {
  if (status === "active") {
    return "success" as const
  }

  if (status === "pending") {
    return "info" as const
  }

  if (status === "password_reset" || status === "passkey_reset") {
    return "warning" as const
  }

  return undefined
}

function createDetailsAction(
  row: Row<UserRecord>,
  onViewUserDetails: ((user: UserRecord) => void) | undefined
): DataTableRowAction<UserRecord>[] {
  if (!onViewUserDetails) {
    return []
  }

  return [
    {
      id: "details",
      label: usersCopy.actions.details,
      onSelect: () => onViewUserDetails(row.original),
    },
  ]
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
        const online = isUserOnline(row.original.lastAccessAt)

        return (
          <DataTableTextAction onClick={() => options.onViewUserDetails?.(row.original)}>
            <span className="inline-flex items-center gap-2">
              <span
                className={`inline-block size-2 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                aria-hidden="true"
                title={resolveOnlineLabel(row.original.lastAccessAt)}
              />
              {row.original.name}
            </span>
          </DataTableTextAction>
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
      cell: ({ row }) => <DataTableSensitiveValue value={row.original.cpf} kind="cpf" />,
    },
    {
      accessorKey: "phoneMasked",
      meta: { label: usersCopy.form.fields.phone },
      header: usersCopy.form.fields.phone,
      cell: ({ row }) => (
        <DataTableSensitiveValue value={row.original.phoneMasked} kind="phone" />
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
      header: () => <div className="text-center font-medium">{usersCopy.filters.status}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(resolveStatusBadgeTone(row.original.status))}
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
      header: () => <div className="text-center font-medium">{usersCopy.details.passkeyLabel}</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.passkeyStatus === "active"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isActive ? "success" : undefined)}
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
          secondary={row.original.authUserId ? undefined : usersCopy.details.localUser}
        />
      ),
    },
    {
      id: "onlineStatus",
      accessorFn: (user) => (isUserOnline(user.lastAccessAt) ? "online" : "offline"),
      meta: { label: usersCopy.filters.online },
      header: () => <div className="text-center font-medium">{usersCopy.filters.online}</div>,
      enableHiding: true,
      enableSorting: false,
      cell: ({ row }) => {
        const online = row.getValue<string>("onlineStatus") === "online"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(online ? "success" : "info")}
            >
              {online ? "Online" : "Offline"}
            </Badge>
          </div>
        )
      },
    },
    createActionsColumn<UserRecord>((row) => {
      const isActive = row.original.status === "active"
      const isBlocked = row.original.status === "inactive"
      const isCurrentUser = Boolean(
        options.currentAuthUserId && row.original.authUserId === options.currentAuthUserId
      )
      const isOwnerUser = row.original.role === "owner"
      const isProtectedTarget = isCurrentUser || (isOwnerUser && !options.canManageOwnerUser)
      const isTemporarilyLocked = row.original.lockedUntil
        ? new Date(row.original.lockedUntil).getTime() > Date.now()
        : false

      return [
        ...createDetailsAction(row, options.onViewUserDetails),
        ...(options.canEditUser && options.onEditUser && !(isOwnerUser && !options.canManageOwnerUser)
          ? [
            {
              id: "edit" as const,
              label: usersCopy.actions.edit,
              onSelect: () => options.onEditUser?.(row.original),
            },
          ]
          : []),
        ...(options.canResetPassword && options.onResetAccess && !isProtectedTarget
          ? [
            {
              id: "reset-access" as const,
              label: usersCopy.actions.resetPassword,
              onSelect: () => options.onResetAccess?.(row.original),
            },
          ]
          : []),
        ...(options.remoteMode && options.canResetPasskey && options.onResetPasskey && !isProtectedTarget && row.original.passkeyStatus === "active"
          ? [
            {
              id: "reset-passkey" as const,
              label: usersCopy.actions.resetPasskey,
              onSelect: () => options.onResetPasskey?.(row.original),
            },
          ]
          : []),
        ...(options.remoteMode && (isBlocked || isTemporarilyLocked) && options.canClearLock && options.onClearLock && !(isOwnerUser && !options.canManageOwnerUser)
          ? [
            {
              id: "clear-lock" as const,
              label: isBlocked ? usersCopy.actions.unblockUser : usersCopy.actions.clearLock,
              onSelect: () => options.onClearLock?.(row.original),
            },
          ]
          : []),
        ...(options.remoteMode && options.canRevokeSessions && options.onRevokeSessions && !isProtectedTarget
          ? [
            {
              id: "revoke-sessions" as const,
              label: usersCopy.actions.revokeSessions,
              onSelect: () => options.onRevokeSessions?.(row.original),
            },
          ]
          : []),
        ...(isActive && options.canBlockUser && options.onBlockUser && !isProtectedTarget
          ? [
            {
              id: "block" as const,
              label: usersCopy.actions.blockUser,
              variant: "destructive" as const,
              separatorBefore: true,
              onSelect: () => options.onBlockUser?.(row.original),
            },
          ]
          : []),
      ]
    }),
  ]
}
