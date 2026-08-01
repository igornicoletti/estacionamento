import { describe, expect, it } from "vitest"

import {
  formatPermissionRoles,
  formatPermissionRolesWithoutAccess,
  toPermissionMatrix,
  toPermissionTableRow,
} from "@/features/permissions/model/permissions-models"
import { createPermissionMatrixPayload } from "../../helpers/permissions-memory-gateway"

describe("permissions matrix model", () => {
  it("maps the wire payload to domain data without presentation metadata", () => {
    const matrix = toPermissionMatrix(createPermissionMatrixPayload())

    expect(matrix.permissions[0]).toEqual({
      description: "Permite visualizar eventos de auditoria.",
      key: "audit.read",
      label: "Visualizar auditoria",
      roleKeys: ["owner", "admin", "auditor"],
    })
  })

  it("derives the table group and role count from domain data", () => {
    const matrix = toPermissionMatrix(createPermissionMatrixPayload())
    const row = toPermissionTableRow(matrix.permissions[0])

    expect(row.groupKey).toBe("audit")
    expect(row.groupLabel).toBe("Auditoria")
    expect(row.roleCount).toBe(3)
  })

  it("formats roles from labels returned by the backend", () => {
    const matrix = toPermissionMatrix(createPermissionMatrixPayload())

    expect(formatPermissionRoles(["admin"], matrix.roles)).toEqual([
      "Administrador",
    ])
    expect(
      formatPermissionRolesWithoutAccess(["admin"], matrix.roles)
    ).toEqual(["Proprietário", "Auditor", "Gestor", "Operador"])
  })
})
