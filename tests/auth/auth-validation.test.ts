import { describe, expect, it } from "vitest"

import {
  AUTH_PERMISSION,
  authCpfSchema,
  authLoginSchema,
  authRecoverySchema,
  isAuthPermission,
  requiredPasswordSchema,
  resolveAuthProfilePermissions,
} from "@/features/auth"
import { isGlobalRole, requiresSingleUnit } from "@/features/users/types/users-types"

describe("auth validation and authorization contracts", () => {
  it("validates CPF before allowing the password flow", () => {
    expect(authCpfSchema.safeParse("529.982.247-25").success).toBe(true)
    expect(authCpfSchema.safeParse("111.111.111-11").success).toBe(false)
  })

  it("requires current credentials and a strong matching replacement password", () => {
    expect(authLoginSchema.safeParse({
      cpf: "529.982.247-25",
      password: "temporary",
    }).success).toBe(true)
    expect(requiredPasswordSchema.safeParse({
      confirmPassword: "StrongPass#123",
      newPassword: "StrongPass#123",
    }).success).toBe(true)
  })

  it("keeps recovery request inputs generic and validated", () => {
    const result = authRecoverySchema.safeParse({
      cpf: "529.982.247-25",
      description: "",
      email: "",
      phone: "11987654321",
      reason: "lost_phone",
    })

    expect(result.success).toBe(true)
  })

  it("enforces unit scope for managers and operators", () => {
    expect(requiresSingleUnit("manager")).toBe(true)
    expect(requiresSingleUnit("operator")).toBe(true)
    expect(isGlobalRole("admin")).toBe(true)
  })

  it("accepts only known permissions and does not fall back after invalid explicit permissions", () => {
    expect(isAuthPermission(AUTH_PERMISSION.auditRead)).toBe(true)
    expect(isAuthPermission("admin.users.disable")).toBe(false)
    expect(resolveAuthProfilePermissions({
      permissions: ["admin.users.disable"],
      roleKey: "owner",
    })).toEqual([])
    expect(resolveAuthProfilePermissions({
      permissions: null,
      roleKey: "owner",
    })).toEqual([AUTH_PERMISSION.all])
  })
})
