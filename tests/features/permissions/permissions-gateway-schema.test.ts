import { describe, expect, it } from "vitest"

import { permissionMatrixPayloadSchema } from "@/features/permissions/schemas/permissions-gateway-schema"

function createPermissionWireRow() {
  return {
    description: "Consulta os eventos de auditoria.",
    key: "audit.read",
    label: "Consultar auditoria",
    roleKeys: ["owner", "admin", "auditor"],
  }
}

function createPermissionRoles() {
  return [
    { key: "owner", label: "Proprietário" },
    { key: "admin", label: "Administrador" },
    { key: "auditor", label: "Auditor" },
    { key: "manager", label: "Gestor" },
    { key: "operator", label: "Operador" },
  ]
}

describe("permissions gateway schema", () => {
  it("accepts the current permission matrix wire contract", () => {
    expect(
      permissionMatrixPayloadSchema.safeParse({
        ok: true,
        permissions: [createPermissionWireRow()],
        roles: createPermissionRoles(),
      }).success
    ).toBe(true)
  })

  it.each([
    ["an unknown role", { roleKeys: ["owner", "super_admin"] }],
    ["an invalid capability key", { key: "audit" }],
    ["duplicate role access", { roleKeys: ["owner", "owner"] }],
    ["an extra field", { secret: "must-not-cross-the-boundary" }],
  ])("rejects %s", (_scenario, overrides) => {
    expect(
      permissionMatrixPayloadSchema.safeParse({
        ok: true,
        permissions: [{ ...createPermissionWireRow(), ...overrides }],
        roles: createPermissionRoles(),
      }).success
    ).toBe(false)
  })

  it("rejects duplicate capability keys", () => {
    const permission = createPermissionWireRow()

    expect(
      permissionMatrixPayloadSchema.safeParse({
        ok: true,
        permissions: [permission, permission],
        roles: createPermissionRoles(),
      }).success
    ).toBe(false)
  })

  it("accepts the wildcard capability", () => {
    expect(
      permissionMatrixPayloadSchema.safeParse({
        ok: true,
        permissions: [
          {
            ...createPermissionWireRow(),
            key: "*",
          },
        ],
        roles: createPermissionRoles(),
      }).success
    ).toBe(true)
  })
})
