import { assertEquals, assertThrows } from "jsr:@std/assert@1"

import { buildPermissionMatrix } from "./permission-matrix.ts"

function createSource() {
  return {
    permissions: [
      {
        description: "Permissão reservada ao proprietário.",
        key: "*",
        label: "Todas as permissões",
      },
      {
        description: "Permite consultar eventos de auditoria.",
        key: "audit.read",
        label: "Ler auditoria",
      },
    ],
    rolePermissions: [
      { permission_key: "*", role_key: "owner" },
      { permission_key: "audit.read", role_key: "auditor" },
    ],
    roles: [
      { key: "owner", label: "Proprietário" },
      { key: "auditor", label: "Auditor" },
    ],
  }
}

Deno.test("buildPermissionMatrix returns canonical roles and expands wildcard access", () => {
  const matrix = buildPermissionMatrix(createSource())

  assertEquals(matrix.roles, [
    { key: "auditor", label: "Auditor" },
    { key: "owner", label: "Proprietário" },
  ])
  assertEquals(matrix.permissions, [
    {
      description: "Permite consultar eventos de auditoria.",
      key: "audit.read",
      label: "Ler auditoria",
      roleKeys: ["auditor", "owner"],
    },
    {
      description: "Permissão reservada ao proprietário.",
      key: "*",
      label: "Todas as permissões",
      roleKeys: ["owner"],
    },
  ])
})

Deno.test("buildPermissionMatrix rejects duplicate permission keys", () => {
  const source = createSource()
  source.permissions.push({ ...source.permissions[0] })

  assertThrows(() => buildPermissionMatrix(source), Error, "duplicate_permission_key")
})

Deno.test("buildPermissionMatrix rejects orphan role assignments", () => {
  const source = createSource()
  source.rolePermissions.push({
    permission_key: "audit.read",
    role_key: "unknown_role",
  })

  assertThrows(() => buildPermissionMatrix(source), Error, "orphan_role_permission")
})

Deno.test("buildPermissionMatrix rejects fields outside the database contract", () => {
  const source = createSource()
  const permission = source.permissions[0] as Record<string, unknown>
  permission.is_critical = true

  assertThrows(
    () => buildPermissionMatrix(source),
    Error,
    "invalid_permission_matrix_source"
  )
})
