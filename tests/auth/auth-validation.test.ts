import { describe, expect, it } from "vitest"

import {
  authCpfSchema,
  authLoginSchema,
  authRecoverySchema,
  isGlobalRole,
  requiresSingleUnit,
  routeCapabilities,
} from "@/features/auth"

describe("auth validation", () => {
  it("validates CPF before allowing the progressive auth flow", () => {
    expect(authCpfSchema.safeParse("529.982.247-25").success).toBe(true)
    expect(authCpfSchema.safeParse("111.111.111-11").success).toBe(false)
  })

  it("requires matching strong new password values", () => {
    const result = authLoginSchema.safeParse({
      confirmNewPassword: "StrongPass#123",
      cpf: "529.982.247-25",
      newPassword: "StrongPass#123",
      password: "temporary",
    })

    expect(result.success).toBe(true)
  })

  it("keeps recovery request response inputs generic and validated", () => {
    const result = authRecoverySchema.safeParse({
      cpf: "529.982.247-25",
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

  it("defines protected capabilities for clients and units routes", () => {
    expect(routeCapabilities.clients).toEqual(["admin.clients.read"])
    expect(routeCapabilities.units).toEqual(["admin.units.read"])
  })
})
