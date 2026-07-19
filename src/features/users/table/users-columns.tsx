import { type ColumnDef, type Row } from "@tanstack/react-table"
import * as React from "react"

import {
  createActionsColumn,
  DataTableStackedCell,
  DataTableTextAction,
  type DataTableRowAction,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { usersCopy } from "../constants"
import {
  appUserStatusLabels,
  resolveEmailLabel,
  resolveLastAccessLabel,
  resolvePasskeyLabel,
  resolveUnitLabel,
  userRoleLabels,
  type UserRecord,
} from "../model"

function maskCpfForDisplay(value: string) {
  const digits = value.replace(/\D/g, "")

  if (digits.length !== 11) {
    return value
  }

  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`
}

function CpfPressToRevealCell({ value }: { value: string }) {
  const [isPressed, setIsPressed] = React.useState(false)

  return (
    <span
      role="button"
      tabIndex={0}
      className="cursor-pointer select-none"
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          setIsPressed(true)
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") {
          setIsPressed(false)
        }
      }}
      aria-label="Pressione para visualizar CPF completo"
      title="Segure para visualizar CPF completo"
    >
      {isPressed ? value : maskCpfForDisplay(value)}
    </span>
  )
}

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
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onViewUserDetails?.(row.original)}>
          {row.original.name}
        </DataTableTextAction>
      ),
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
      cell: ({ row }) => {
        const value = row.original.cpf

        if (!value) {
          return "—"
        }

        return <CpfPressToRevealCell value={value} />
      },
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
      header: usersCopy.filters.status,
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={getBadgeToneClassName(resolveStatusBadgeTone(row.original.status))}
        >
          {appUserStatusLabels[row.original.status]}
        </Badge>
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
      header: usersCopy.details.passkeyLabel,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.passkeyStatus === "active"

        return (
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(isActive ? "success" : undefined)}
          >
            {resolvePasskeyLabel(row.original.passkeyStatus)}
          </Badge>
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
        ...(options.canEditUser && options.onEditUser
          ? [
            {
              id: "edit" as const,
              label: usersCopy.actions.edit,
              disabled: isOwnerUser && !options.canManageOwnerUser,
              onSelect: () => options.onEditUser?.(row.original),
            },
          ]
          : []),
        ...(options.canResetPassword && options.onResetAccess
          ? [
            {
              id: "reset-access" as const,
              label: usersCopy.actions.resetPassword,
              disabled: isProtectedTarget,
              onSelect: () => options.onResetAccess?.(row.original),
            },
          ]
          : []),
        ...(options.remoteMode && options.canResetPasskey && options.onResetPasskey
          ? [
            {
              id: "reset-passkey" as const,
              label: usersCopy.actions.resetPasskey,
              disabled: isProtectedTarget,
              onSelect: () => options.onResetPasskey?.(row.original),
            },
          ]
          : []),
        ...(options.remoteMode && (isBlocked || isTemporarilyLocked) && options.canClearLock && options.onClearLock
          ? [
            {
              id: "clear-lock" as const,
              label: isBlocked ? usersCopy.actions.unblockUser : usersCopy.actions.clearLock,
              disabled: isOwnerUser && !options.canManageOwnerUser,
              onSelect: () => options.onClearLock?.(row.original),
            },
          ]
          : []),
        ...(options.remoteMode && options.canRevokeSessions && options.onRevokeSessions
          ? [
            {
              id: "revoke-sessions" as const,
              label: usersCopy.actions.revokeSessions,
              disabled: isProtectedTarget,
              onSelect: () => options.onRevokeSessions?.(row.original),
            },
          ]
          : []),
        ...(isActive && options.canBlockUser && options.onBlockUser
          ? [
            {
              id: "block" as const,
              label: usersCopy.actions.blockUser,
              disabled: isProtectedTarget,
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
