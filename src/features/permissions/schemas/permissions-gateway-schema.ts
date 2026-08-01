import { z } from "zod"

import { AUTH_ROLE_KEY } from "@/features/auth/contracts"

export const permissionRoleKeyValues = [
  AUTH_ROLE_KEY.owner,
  AUTH_ROLE_KEY.admin,
  AUTH_ROLE_KEY.auditor,
  AUTH_ROLE_KEY.manager,
  AUTH_ROLE_KEY.operator,
] as const

const permissionKeySchema = z
  .union([
    z.literal("*"),
    z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/),
  ])
const nonBlankPermissionText = (maximumLength: number) =>
  z.string().trim().min(1).max(maximumLength)

export const permissionRoleWireSchema = z
  .object({
    key: z.enum(permissionRoleKeyValues),
    label: nonBlankPermissionText(128),
  })
  .strict()

export const permissionWireRowSchema = z
  .object({
    description: z.string().trim().max(1_000).nullable(),
    key: permissionKeySchema,
    label: nonBlankPermissionText(160),
    roleKeys: z
      .array(z.enum(permissionRoleKeyValues))
      .max(permissionRoleKeyValues.length),
  })
  .strict()
  .superRefine((row, context) => {
    if (new Set(row.roleKeys).size !== row.roleKeys.length) {
      context.addIssue({
        code: "custom",
        message: "Permission roles must be unique.",
        path: ["roleKeys"],
      })
    }
  })

export const permissionMatrixPayloadSchema = z
  .object({
    ok: z.literal(true),
    permissions: z.array(permissionWireRowSchema).max(500),
    roles: z
      .array(permissionRoleWireSchema)
      .length(permissionRoleKeyValues.length),
  })
  .strict()
  .superRefine((payload, context) => {
    const permissionKeys = new Set<string>()
    const roleKeys = new Set(payload.roles.map((role) => role.key))

    if (roleKeys.size !== payload.roles.length) {
      context.addIssue({
        code: "custom",
        message: "Permission matrix roles must be unique.",
        path: ["roles"],
      })
    }

    for (const expectedRole of permissionRoleKeyValues) {
      if (!roleKeys.has(expectedRole)) {
        context.addIssue({
          code: "custom",
          message: "Permission matrix must contain every canonical role.",
          path: ["roles"],
        })
      }
    }

    payload.permissions.forEach((permission, index) => {
      if (permissionKeys.has(permission.key)) {
        context.addIssue({
          code: "custom",
          message: "Permission keys must be unique.",
          path: ["permissions", index, "key"],
        })
      }

      permissionKeys.add(permission.key)

      permission.roleKeys.forEach((roleKey, roleIndex) => {
        if (!roleKeys.has(roleKey)) {
          context.addIssue({
            code: "custom",
            message: "Permission access must reference a returned role.",
            path: ["permissions", index, "roleKeys", roleIndex],
          })
        }
      })
    })
  })

export type PermissionWireRow = z.infer<typeof permissionWireRowSchema>
export type PermissionRoleWire = z.infer<typeof permissionRoleWireSchema>
export type PermissionMatrixWirePayload = z.infer<
  typeof permissionMatrixPayloadSchema
>
