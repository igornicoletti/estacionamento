import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { PermissionAccessIcon } from "../components/permission-access-icon"
import { permissionsCopy } from "../constants/permissions-copy"
import {
  type PermissionRole,
  type PermissionTableRow,
} from "../model/permissions-types"

interface CreatePermissionsColumnsOptions {
  onOpenDetails: (permission: PermissionTableRow) => void
  roles: readonly PermissionRole[]
}

function createRoleAccessColumn(
  role: PermissionRole
): ColumnDef<PermissionTableRow> {
  return {
    id: role.key,
    accessorFn: (row) =>
      row.roleKeys.includes(role.key)
        ? "with_access"
        : "without_access",
    cell: ({ row }) => (
      <PermissionAccessIcon
        hasAccess={row.original.roleKeys.includes(role.key)}
      />
    ),
    enableSorting: false,
    header: () => <div className="text-center">{role.label}</div>,
    meta: { label: role.label },
  }
}

export function createPermissionsColumns({
  onOpenDetails,
  roles,
}: CreatePermissionsColumnsOptions): ColumnDef<PermissionTableRow>[] {
  return [
    {
      accessorKey: "label",
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails(row.original)
          }}
        >
          {row.original.label}
        </DataTableTextAction>
      ),
      header: permissionsCopy.labels.permission,
      meta: { label: permissionsCopy.labels.permission },
    },
    {
      accessorKey: "groupLabel",
      cell: ({ row }) => row.original.groupLabel,
      header: permissionsCopy.labels.group,
      meta: { label: permissionsCopy.labels.group },
    },
    {
      accessorKey: "roleCount",
      cell: ({ row }) => (
        <div className="text-center tabular-nums">{row.original.roleCount}</div>
      ),
      header: () => <div className="text-center">{permissionsCopy.labels.totalRoles}</div>,
      meta: { label: permissionsCopy.labels.totalRoles },
    },
    ...roles.map(createRoleAccessColumn),
    createActionsColumn<PermissionTableRow>([
      {
        id: "details",
        label: permissionsCopy.actions.details,
        onSelect: (row) => {
          onOpenDetails(row.original)
        },
      },
    ]),
  ]
}
