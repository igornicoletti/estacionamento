import { describe, expect, it } from "vitest"

import {
  createPermissionRoleAccess,
  formatPermissionRoles,
  formatPermissionRolesWithoutAccess,
  normalizePermissionMatrixRow,
} from "@/features/permissions"

describe("permissions matrix model", () => {
  it("builds role access maps from canonical role ordering", () => {
    expect(createPermissionRoleAccess(["operator", "admin"])).toEqual({
      admin: true,
      auditor: false,
      manager: false,
      operator: true,
      owner: false,
    })
  })

  it("formats role labels consistently for access and no-access views", () => {
    expect(formatPermissionRoles(["admin"])).toBe("Administrador")
    expect(formatPermissionRoles([])).toBe("Nenhum perfil")

    const noAccess = formatPermissionRolesWithoutAccess(["admin"])
    expect(noAccess).toContain("Proprietário")
    expect(noAccess).toContain("Auditor")
    expect(noAccess).toContain("Gestor")
    expect(noAccess).toContain("Operador")
  })

  it("normalizes fetched matrix rows with counts, labels and filters", () => {
    const row = normalizePermissionMatrixRow({
      accessFilters: [],
      description: null,
      groupKey: "audit",
      groupLabel: "Auditoria",
      id: "permission-audit-read",
      isCritical: true,
      key: "audit.read",
      label: "Visualizar auditoria",
      roleAccess: createPermissionRoleAccess([]),
      roleCount: 0,
      roleLabels: "",
      roles: ["operator", "admin"],
      source: "system",
    })

    expect(row.roles).toEqual(["admin", "operator"])
    expect(row.roleCount).toBe(2)
    expect(row.roleLabels).toBe("Administrador, Operador")
    expect(row.accessFilters).toEqual(["with_access", "without_access"])
  })
})
