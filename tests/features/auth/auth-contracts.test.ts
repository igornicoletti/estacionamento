import { describe, expect, it } from "vitest"

import {
  AUTH_PERMISSION,
  AUTH_STATUS,
  canAccessProtectedApp,
  requiresAccountRecovery,
  resolveAuthProfilePermissions,
} from "@/features/auth/contracts"

describe("auth contracts", () => {
  it("allows active accounts and the transitional legacy passkey status", () => {
    expect(canAccessProtectedApp(AUTH_STATUS.active)).toBe(true)
    expect(canAccessProtectedApp(AUTH_STATUS.passkeyReset)).toBe(true)
    expect(canAccessProtectedApp(AUTH_STATUS.pending)).toBe(false)
    expect(canAccessProtectedApp(AUTH_STATUS.passwordReset)).toBe(false)
    expect(canAccessProtectedApp(AUTH_STATUS.inactive)).toBe(false)
  })

  it("fails closed when the backend does not return permissions", () => {
    expect(
      resolveAuthProfilePermissions({
        permissions: null,
        roleKey: "owner",
      })
    ).toEqual([])
  })

  it("accepts only known permissions returned by the backend", () => {
    expect(
      resolveAuthProfilePermissions({
        permissions: [
          AUTH_PERMISSION.unitsRead,
          "unknown.permission",
          AUTH_PERMISSION.unitsRead,
        ],
        roleKey: "operator",
      })
    ).toEqual([AUTH_PERMISSION.unitsRead])
  })

  it("does not treat passkey reset as account recovery", () => {
    expect(requiresAccountRecovery(AUTH_STATUS.passkeyReset)).toBe(false)
    expect(requiresAccountRecovery(AUTH_STATUS.passwordReset)).toBe(true)
  })
})
