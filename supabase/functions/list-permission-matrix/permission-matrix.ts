import { z } from "npm:zod@4.4.3"

export const permissionMatrixLimits = {
  permissions: 500,
  rolePermissions: 500,
  roles: 20,
} as const

const permissionKeySchema = z.union([
  z.literal("*"),
  z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/),
])
const roleKeySchema = z.string().regex(/^[a-z][a-z0-9_]*$/).max(64)
const nonBlankText = (maximumLength: number) =>
  z.string().trim().min(1).max(maximumLength)

const permissionRowSchema = z
  .object({
    description: z.string().trim().max(1_000).nullable(),
    key: permissionKeySchema,
    label: nonBlankText(160),
  })
  .strict()

const roleRowSchema = z
  .object({
    key: roleKeySchema,
    label: nonBlankText(128),
  })
  .strict()

const rolePermissionRowSchema = z
  .object({
    permission_key: permissionKeySchema,
    role_key: roleKeySchema,
  })
  .strict()

const permissionMatrixSourceSchema = z
  .object({
    permissions: z.array(permissionRowSchema).max(permissionMatrixLimits.permissions),
    rolePermissions: z
      .array(rolePermissionRowSchema)
      .max(permissionMatrixLimits.rolePermissions),
    roles: z.array(roleRowSchema).max(permissionMatrixLimits.roles),
  })
  .strict()

function assertUnique(values: readonly string[], fieldName: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`duplicate_${fieldName}`)
  }
}

export function buildPermissionMatrix(source: unknown) {
  const parsed = permissionMatrixSourceSchema.safeParse(source)

  if (!parsed.success) {
    throw new Error("invalid_permission_matrix_source", { cause: parsed.error })
  }

  const { permissions, rolePermissions, roles } = parsed.data
  assertUnique(permissions.map((permission) => permission.key), "permission_key")
  assertUnique(roles.map((role) => role.key), "role_key")
  assertUnique(
    rolePermissions.map(({ permission_key, role_key }) => `${role_key}:${permission_key}`),
    "role_permission"
  )

  const permissionKeys = new Set(permissions.map((permission) => permission.key))
  const roleKeys = new Set(roles.map((role) => role.key))
  const rolesByPermission = new Map<string, Set<string>>()

  for (const rolePermission of rolePermissions) {
    if (
      !permissionKeys.has(rolePermission.permission_key) ||
      !roleKeys.has(rolePermission.role_key)
    ) {
      throw new Error("orphan_role_permission")
    }

    const assignedRoles = rolesByPermission.get(rolePermission.permission_key) ??
      new Set<string>()
    assignedRoles.add(rolePermission.role_key)
    rolesByPermission.set(rolePermission.permission_key, assignedRoles)
  }

  const sortedRoles = [...roles].sort((left, right) =>
    left.label.localeCompare(right.label, "pt-BR") || left.key.localeCompare(right.key)
  )
  const wildcardRoles = rolesByPermission.get("*") ?? new Set<string>()
  const matrix = [...permissions]
    .sort((left, right) =>
      left.label.localeCompare(right.label, "pt-BR") || left.key.localeCompare(right.key)
    )
    .map((permission) => ({
      description: permission.description,
      key: permission.key,
      label: permission.label,
      roleKeys: sortedRoles
        .map((role) => role.key)
        .filter((roleKey) =>
          wildcardRoles.has(roleKey) ||
          rolesByPermission.get(permission.key)?.has(roleKey)
        ),
    }))

  return {
    permissions: matrix,
    roles: sortedRoles,
  }
}
