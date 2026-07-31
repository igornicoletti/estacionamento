import { afterEach, describe, expect, it, vi } from "vitest"

import {
  configurePermissionsGateway,
  listPermissionMatrix,
  resetPermissionsGateway,
} from "@/features/permissions"

describe("permissions service", () => {
  afterEach(() => {
    resetPermissionsGateway()
  })

  it("returns the matrix supplied by the protected backend gateway", async () => {
    const listMatrix = vi.fn().mockResolvedValue([
      {
        accessFilters: ["with_access", "without_access"],
        description: "Permite visualizar eventos de auditoria.",
        groupKey: "audit",
        groupLabel: "Auditoria",
        id: "audit.read",
        isCritical: true,
        key: "audit.read",
        label: "Visualizar auditoria",
        roleAccess: {
          admin: true,
          auditor: true,
          manager: false,
          operator: false,
          owner: true,
        },
        roleCount: 3,
        roleLabels: "Proprietário, Administrador, Auditor",
        roles: ["owner", "admin", "auditor"],
        source: "system",
      },
    ])
    configurePermissionsGateway({ listMatrix })

    const permissions = await listPermissionMatrix()

    expect(listMatrix).toHaveBeenCalledOnce()
    expect(permissions).toHaveLength(1)
    expect(permissions[0]?.key).toBe("audit.read")
  })

  it("does not replace a backend failure with a generated fallback", async () => {
    configurePermissionsGateway({
      listMatrix: () => Promise.reject(new Error("backend indisponível")),
    })

    await expect(listPermissionMatrix()).rejects.toThrow("backend indisponível")
  })
})
