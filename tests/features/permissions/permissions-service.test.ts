import { describe, expect, it } from "vitest"

import { AUTH_PERMISSION } from "@/features/auth"
import {
  buildPermissionMatrix,
  listPermissionMatrix,
} from "@/features/permissions"

describe("permissions service", () => {
  it("builds a normalized permission matrix from auth permissions", () => {
    const permissions = buildPermissionMatrix()
    const auditPermission = permissions.find((permission) => {
      return permission.key === AUTH_PERMISSION.auditRead
    })

    expect(auditPermission).toMatchObject({
      groupKey: "audit",
      groupLabel: "Auditoria",
      isCritical: true,
      label: "Auditoria - Consultar",
      source: "system",
    })
    expect(auditPermission?.roleAccess.owner).toBe(true)
    expect(auditPermission?.roleAccess.admin).toBe(true)
    expect(auditPermission?.roleAccess.auditor).toBe(true)
    expect(auditPermission?.roleAccess.manager).toBe(false)
    expect(auditPermission?.accessFilters).toEqual([
      "with_access",
      "without_access",
    ])
  })

  it("lists the generated permission matrix asynchronously", async () => {
    const permissions = await listPermissionMatrix()

    expect(permissions.length).toBeGreaterThan(0)
    expect(permissions.some((permission) => permission.key === AUTH_PERMISSION.usersManage)).toBe(true)
  })
})
