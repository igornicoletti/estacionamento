import { type ColumnDef } from "@tanstack/react-table"
import { CheckIcon, XIcon } from "lucide-react"

import { createActionsColumn } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { permissionsCopy } from "../permissions-copy"
import {
  permissionRoleLabels,
  permissionRoleValues,
  permissionSourceLabels,
  type PermissionMatrixRow,
  type PermissionRole,
} from "../types/permissions-types"

interface CreatePermissionsColumnsOptions {
  onOpenDetails?: (permission: PermissionMatrixRow) => void
}

function PermissionAccessIcon({ hasAccess }: { hasAccess: boolean }) {
  const Icon = hasAccess ? CheckIcon : XIcon

  return (
    <span className="flex justify-center">
      <Icon
        aria-label={
          hasAccess
            ? permissionsCopy.accessibility.withAccess
            : permissionsCopy.accessibility.withoutAccess
        }
        className={cn(
          "size-4",
          hasAccess ? "text-primary" : "text-muted-foreground"
        )}
      />
    </span>
  )
}

function createRoleAccessColumn(
  role: PermissionRole
): ColumnDef<PermissionMatrixRow> {
  return {
    id: role,
    accessorFn: (row) => (row.roleAccess[role] ? "with_access" : "without_access"),
    cell: ({ row }) => (
      <PermissionAccessIcon hasAccess={row.original.roleAccess[role]} />
    ),
    enableSorting: false,
    header: () => <div className="text-center">{permissionRoleLabels[role]}</div>,
    meta: { label: permissionRoleLabels[role] },
  }
}

export function createPermissionsColumns({
  onOpenDetails,
}: CreatePermissionsColumnsOptions = {}): ColumnDef<PermissionMatrixRow>[] {
  return [
    {
      accessorKey: "label",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="link"
          className={cn("h-auto justify-start px-0 text-left font-medium")}
          onClick={() => onOpenDetails?.(row.original)}
        >
          {row.original.label}
        </Button>
      ),
      header: permissionsCopy.labels.permission,
      meta: { label: permissionsCopy.labels.permission },
    },
    {
      accessorKey: "groupLabel",
      cell: ({ row }) => <Badge variant="outline">{row.original.groupLabel}</Badge>,
      header: permissionsCopy.labels.group,
      meta: { label: permissionsCopy.labels.group },
    },
    {
      accessorKey: "source",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {permissionSourceLabels[row.original.source]}
        </Badge>
      ),
      enableSorting: false,
      header: permissionsCopy.labels.source,
      meta: { label: permissionsCopy.labels.source },
    },
    {
      accessorKey: "roleCount",
      cell: ({ row }) => (
        <div className="text-center tabular-nums">{row.original.roleCount}</div>
      ),
      header: () => <div className="text-center">{permissionsCopy.labels.totalRoles}</div>,
      meta: { label: permissionsCopy.labels.totalRoles },
    },
    ...permissionRoleValues.map(createRoleAccessColumn),
    {
      id: "roles",
      accessorFn: (row) => row.roles,
      enableSorting: false,
      header: permissionsCopy.filters.roles,
      meta: { label: permissionsCopy.filters.roles },
    },
    {
      id: "accessFilters",
      accessorFn: (row) => row.accessFilters,
      enableSorting: false,
      header: permissionsCopy.filters.access,
      meta: { label: permissionsCopy.filters.access },
    },
    createActionsColumn<PermissionMatrixRow>([
      {
        id: "details",
        label: permissionsCopy.actions.details,
        onSelect: (row) => onOpenDetails?.(row.original),
      },
    ]),
  ]
}
