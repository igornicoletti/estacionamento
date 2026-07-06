import { describe, expect, it } from "vitest"

import {
  formatRolesWithAccess,
  formatRolesWithoutAccess,
  listPermissionCapabilityDescriptors,
  resolvePermissionGroup,
} from "@/features/permissions"

describe("permissions matrix model", () => {
  it("maps capability groups without duplicating prefix logic in consumers", () => {
    expect(resolvePermissionGroup("audit.read")).toBe("audit")
    expect(resolvePermissionGroup("admin.clients.manage")).toBe("clients")
    expect(resolvePermissionGroup("passkeys.manageSelf")).toBe("passkeys")
  })

  it("builds descriptors aligned with capability labels", () => {
    const descriptors = listPermissionCapabilityDescriptors()

    expect(descriptors.length).toBeGreaterThan(0)
    expect(descriptors[0]).toMatchObject({
      capability: "audit.read",
      label: "Visualizar auditoria",
      group: "audit",
      groupLabel: "Auditoria",
    })
  })

  it("formats role labels consistently for access and no-access views", () => {
    expect(formatRolesWithAccess(["admin"])).toBe("Administrador")
    expect(formatRolesWithAccess([])).toBe("Nenhum perfil")

    const noAccess = formatRolesWithoutAccess(["admin"])
    expect(noAccess).toContain("Proprietário")
    expect(noAccess).toContain("Auditor")
    expect(noAccess).toContain("Gerente")
    expect(noAccess).toContain("Operador")
  })
})
