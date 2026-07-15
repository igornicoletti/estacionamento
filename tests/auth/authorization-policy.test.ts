import { describe, expect, it } from "vitest"

import {
  AUTH_PERMISSION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_ROLE_KEY,
} from "@/features/auth"
import {
  allRoles,
  canManageRole,
  getAssignableRoles,
  hasAllPermissions,
  hasAnyPermission,
  isGlobalRole,
  isRoleSuperior,
  permissionsByRole,
  unitScopedRoles,
} from "@/features/auth/authorization/authorization-policy"

describe("authorization-policy", () => {
  describe("role hierarchy", () => {
    it("owner can manage all other roles", () => {
      expect(canManageRole("owner", "admin")).toBe(true)
      expect(canManageRole("owner", "auditor")).toBe(true)
      expect(canManageRole("owner", "manager")).toBe(true)
      expect(canManageRole("owner", "operator")).toBe(true)
    })

    it("admin can manage auditor, manager, operator but not owner", () => {
      expect(canManageRole("admin", "auditor")).toBe(true)
      expect(canManageRole("admin", "manager")).toBe(true)
      expect(canManageRole("admin", "operator")).toBe(true)
      expect(canManageRole("admin", "owner")).toBe(false)
    })

    it("no role can manage itself", () => {
      for (const role of allRoles) {
        expect(canManageRole(role, role)).toBe(false)
      }
    })

    it("operator cannot manage any role", () => {
      for (const role of allRoles) {
        expect(canManageRole("operator", role)).toBe(false)
      }
    })

    it("isRoleSuperior returns strictly superior roles", () => {
      expect(isRoleSuperior("admin", "operator")).toBe(true)
      expect(isRoleSuperior("admin", "admin")).toBe(false)
      expect(isRoleSuperior("operator", "admin")).toBe(false)
    })
  })

  describe("assignable roles", () => {
    it("owner can assign all roles except owner", () => {
      const assignable = getAssignableRoles("owner")
      expect(assignable).toContain("admin")
      expect(assignable).toContain("auditor")
      expect(assignable).toContain("manager")
      expect(assignable).toContain("operator")
      expect(assignable).not.toContain("owner")
    })

    it("admin can assign auditor, manager, operator", () => {
      const assignable = getAssignableRoles("admin")
      expect(assignable).toContain("auditor")
      expect(assignable).toContain("manager")
      expect(assignable).toContain("operator")
      expect(assignable).not.toContain("admin")
      expect(assignable).not.toContain("owner")
    })

    it("operator cannot assign any role", () => {
      expect(getAssignableRoles("operator")).toHaveLength(0)
    })
  })

  describe("permission verification", () => {
    it("hasAllPermissions returns true for empty required", () => {
      expect(hasAllPermissions([], [])).toBe(true)
    })

    it("wildcard grants all permissions", () => {
      expect(
        hasAllPermissions([AUTH_PERMISSION_WILDCARD], [
          AUTH_PERMISSION.unitsRead,
          AUTH_PERMISSION.pricesManage,
          AUTH_PERMISSION.auditRead,
        ])
      ).toBe(true)
    })

    it("returns false if any required permission is missing", () => {
      expect(
        hasAllPermissions(
          [AUTH_PERMISSION.unitsRead, AUTH_PERMISSION.clientsRead],
          [AUTH_PERMISSION.unitsRead, AUTH_PERMISSION.pricesManage]
        )
      ).toBe(false)
    })

    it("returns true when all required permissions are present", () => {
      expect(
        hasAllPermissions(
          [AUTH_PERMISSION.unitsRead, AUTH_PERMISSION.pricesManage],
          [AUTH_PERMISSION.unitsRead, AUTH_PERMISSION.pricesManage]
        )
      ).toBe(true)
    })

    it("hasAnyPermission returns true if at least one matches", () => {
      expect(
        hasAnyPermission(
          [AUTH_PERMISSION.unitsRead],
          [AUTH_PERMISSION.unitsRead, AUTH_PERMISSION.pricesManage]
        )
      ).toBe(true)
    })

    it("hasAnyPermission returns false if none match", () => {
      expect(
        hasAnyPermission(
          [AUTH_PERMISSION.unitsRead],
          [AUTH_PERMISSION.pricesManage, AUTH_PERMISSION.auditRead]
        )
      ).toBe(false)
    })
  })

  describe("role permissions mapping", () => {
    it("owner has wildcard permission only", () => {
      expect(permissionsByRole[AUTH_ROLE_KEY.owner]).toEqual([AUTH_PERMISSION_WILDCARD])
    })

    it("admin has all non-wildcard permissions", () => {
      const adminPerms = permissionsByRole[AUTH_ROLE_KEY.admin]
      expect(adminPerms).toContain(AUTH_PERMISSION.pricesManage)
      expect(adminPerms).toContain(AUTH_PERMISSION.rulesManage)
      expect(adminPerms).toContain(AUTH_PERMISSION.usersManage)
      expect(adminPerms).toContain(AUTH_PERMISSION.syncExecute)
      expect(adminPerms).not.toContain(AUTH_PERMISSION_WILDCARD)
    })

    it("operator has only read-level permissions", () => {
      const operatorPerms = permissionsByRole[AUTH_ROLE_KEY.operator]
      expect(operatorPerms).toContain(AUTH_PERMISSION.unitsRead)
      expect(operatorPerms).toContain(AUTH_PERMISSION.clientsRead)
      expect(operatorPerms).toContain(AUTH_PERMISSION.pricesRead)
      expect(operatorPerms).not.toContain(AUTH_PERMISSION.pricesManage)
      expect(operatorPerms).not.toContain(AUTH_PERMISSION.usersRead)
    })

    it("manager inherits all operator permissions plus usersRead", () => {
      const managerPerms = permissionsByRole[AUTH_ROLE_KEY.manager]
      const operatorPerms = permissionsByRole[AUTH_ROLE_KEY.operator]
      for (const perm of operatorPerms) {
        expect(managerPerms).toContain(perm)
      }
      expect(managerPerms).toContain(AUTH_PERMISSION.usersRead)
    })

    it("each role level inherits all permissions from lower levels", () => {
      const hierarchy: (typeof AUTH_ROLE_KEY)[keyof typeof AUTH_ROLE_KEY][] = [
        "operator",
        "manager",
        "auditor",
        "admin",
      ]

      for (let i = 1; i < hierarchy.length; i++) {
        const lowerPerms = permissionsByRole[hierarchy[i - 1]]
        const upperPerms = permissionsByRole[hierarchy[i]]
        for (const perm of lowerPerms) {
          expect(upperPerms).toContain(perm)
        }
      }
    })
  })

  describe("unit scope", () => {
    it("operator and manager are unit-scoped", () => {
      expect(unitScopedRoles.has("operator")).toBe(true)
      expect(unitScopedRoles.has("manager")).toBe(true)
    })

    it("admin, auditor, owner are global", () => {
      expect(isGlobalRole("admin")).toBe(true)
      expect(isGlobalRole("auditor")).toBe(true)
      expect(isGlobalRole("owner")).toBe(true)
    })

    it("operator and manager are not global", () => {
      expect(isGlobalRole("operator")).toBe(false)
      expect(isGlobalRole("manager")).toBe(false)
    })
  })
})
