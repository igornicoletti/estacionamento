import { describe, expect, it } from "vitest"

import {
  canManageUserTarget,
  getAssignableUserRoles,
} from "@/features/users/model/users-admin-policy"
import type { UserRecord, UserRole } from "@/features/users"

function createTarget(
  role: UserRole,
  authUserId = `target-${role}`
): UserRecord {
  return {
    authUserId,
    cpf: "529.982.247-25",
    email: null,
    id: `USR-${role}`,
    lastAccessAt: null,
    name: `Usuário ${role}`,
    passkeyStatus: "inactive",
    phoneMasked: null,
    role,
    status: "active",
    unitId: null,
    unitName: null,
  }
}

describe("users administrative policy", () => {
  it("allows owners to assign every supported role", () => {
    expect(getAssignableUserRoles("owner")).toEqual([
      "owner",
      "admin",
      "auditor",
      "manager",
      "operator",
    ])
  })

  it("prevents admins from assigning or managing owners", () => {
    expect(getAssignableUserRoles("admin")).not.toContain("owner")
    expect(
      canManageUserTarget(
        { authUserId: "actor-admin", role: "admin" },
        createTarget("owner")
      )
    ).toBe(false)
  })

  it("prevents self-management and targets without an auth identity", () => {
    expect(
      canManageUserTarget(
        { authUserId: "same-user", role: "owner" },
        createTarget("operator", "same-user")
      )
    ).toBe(false)
    expect(
      canManageUserTarget(
        { authUserId: "actor-owner", role: "owner" },
        { ...createTarget("operator"), authUserId: undefined }
      )
    ).toBe(false)
  })

  it("allows an owner to manage another authenticated user", () => {
    expect(
      canManageUserTarget(
        { authUserId: "actor-owner", role: "owner" },
        createTarget("owner", "another-owner")
      )
    ).toBe(true)
  })
})
