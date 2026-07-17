import { type ColumnDef } from "@tanstack/react-table"
import { CheckIcon, XIcon } from "lucide-react"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
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
          hasAccess ? "text-success" : "text-muted-foreground"
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

function getSourceBadgeVariant(source: PermissionMatrixRow["source"]) {
  return source === "custom" ? "default" : "secondary"
}

export function createPermissionsColumns({
  onOpenDetails,
}: CreatePermissionsColumnsOptions = {}): ColumnDef<PermissionMatrixRow>[] {
  return [
    {
      accessorKey: "label",
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => onOpenDetails?.(row.original)}
        >
          {row.original.label}
        </DataTableTextAction>
      ),
      header: permissionsCopy.labels.permission,
      meta: { label: permissionsCopy.labels.permission },
    },
    {
      accessorKey: "groupLabel",
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">
          {row.original.groupLabel}
        </span>
      ),
      header: permissionsCopy.labels.group,
      meta: { label: permissionsCopy.labels.group },
    },
    {
      accessorKey: "source",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant={getSourceBadgeVariant(row.original.source)}>
            {permissionSourceLabels[row.original.source]}
          </Badge>
        </div>
      ),
      enableSorting: false,
      header: () => <div className="text-center">{permissionsCopy.labels.source}</div>,
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
    createActionsColumn<PermissionMatrixRow>([
      {
        id: "details",
        label: permissionsCopy.actions.details,
        onSelect: (row) => onOpenDetails?.(row.original),
      },
    ]),
  ]
}
