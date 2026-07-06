import { type ColumnDef } from "@tanstack/react-table"
import { CheckIcon } from "lucide-react"

import {
  userRoleLabels,
  userRoleValues,
} from "@/features/auth"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"

import { permissionsCopy } from "../permissions-copy"
import { type PermissionMatrixRow } from "../types/permissions-types"
import { formatRolesWithoutAccess } from "../utils/permissions-matrix-model"

function getRolesWithoutAccessLabel(row: PermissionMatrixRow) {
  return formatRolesWithoutAccess(row.roles)
}

export function getPermissionDetails(row: PermissionMatrixRow) {
  return {
    title: row.label,
    description: `Grupo: ${row.groupLabel}`,
    items: [
      { label: permissionsCopy.labels.permission, value: row.label },
      { label: permissionsCopy.labels.group, value: row.groupLabel },
      { label: permissionsCopy.labels.rolesWithAccess, value: row.roleLabels },
      { label: permissionsCopy.labels.rolesWithoutAccess, value: getRolesWithoutAccessLabel(row) },
      { label: permissionsCopy.labels.totalRoles, value: row.roleCount },
    ],
  }
}

export function createPermissionsColumns(): ColumnDef<PermissionMatrixRow>[] {
  const detailsAction = createDataTableDetailsAction<PermissionMatrixRow>(
    (row) => getPermissionDetails(row.original)
  )

  const roleColumns: ColumnDef<PermissionMatrixRow>[] = userRoleValues.map(
    (role) => ({
      id: role,
      meta: { label: userRoleLabels[role] },
      header: () => <div className="text-center">{userRoleLabels[role]}</div>,
      enableSorting: false,
      accessorFn: (row) => (row.roles.includes(role) ? 1 : 0),
      cell: ({ getValue }) => {
        const hasAccess = getValue<number>() > 0

        return (
          <div className="flex justify-center">
            {hasAccess ? (
              <CheckIcon
                className="size-4 text-emerald-600"
                aria-label={permissionsCopy.accessibility.withAccess}
                aria-hidden={false}
              />
            ) : (
              <span
                className="text-muted-foreground"
                aria-label={permissionsCopy.accessibility.withoutAccess}
              >
                —
              </span>
            )}
          </div>
        )
      },
    })
  )

  return [
    {
      accessorKey: "label",
      meta: { label: permissionsCopy.labels.permission },
      header: permissionsCopy.labels.permission,
      cell: ({ row }) => (
        <DataTableDetails
          {...getPermissionDetails(row.original)}
          trigger={
            <DataTableDetailsTextTrigger>
              {row.original.label}
            </DataTableDetailsTextTrigger>
          }
        />
      ),
    },
    {
      accessorKey: "groupLabel",
      meta: { label: permissionsCopy.labels.group },
      header: permissionsCopy.labels.group,
    },
    {
      accessorKey: "roleCount",
      meta: { label: permissionsCopy.labels.rolesWithAccess },
      header: permissionsCopy.labels.rolesWithAccess,
    },
    ...roleColumns,
    createActionsColumn<PermissionMatrixRow>([detailsAction]),
  ]
}
