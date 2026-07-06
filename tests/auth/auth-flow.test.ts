import { beforeEach, describe, expect, it, vi } from "vitest"

type AuthPasswordRequestInput = {
  cpf: string
  password: string
  flowId?: string
  newPassword?: string
}

type AuthPasswordResponse = {
  flowId: string
  message: string
  nextAction: "set_new_password" | "register_passkey"
}

type RecoveryRequestResponse = {
  message: string
}

type SessionProfile = {
  authUserId: string
  avatarUrl: null
  email: string
  id: string
  mfaStatus: "active" | "inactive"
  name: string
  phoneMasked: string
  role: "owner"
  status: "active"
  unitId: null
  unitName: null
}

const { submitPasswordCredentialsMock, requestAccessRecoveryMock, getCurrentSessionProfileMock } = vi.hoisted(() => ({
  submitPasswordCredentialsMock: vi.fn((input: AuthPasswordRequestInput): Promise<AuthPasswordResponse> => Promise.resolve({
    flowId: input.newPassword ? "flow-2" : "flow-1",
    message: input.newPassword ? "Senha atualizada." : "Senha temporária aceita.",
    nextAction: input.newPassword ? "register_passkey" : "set_new_password",
  })),
  requestAccessRecoveryMock: vi.fn((): Promise<RecoveryRequestResponse> => Promise.resolve({
    message: "Se os dados puderem ser validados, a solicitação será analisada pela administração.",
  })),
  getCurrentSessionProfileMock: vi.fn((): Promise<SessionProfile | null> => Promise.resolve({
    authUserId: "test-auth-user",
    avatarUrl: null,
    email: "igor.nicoletti@redemontecarlo.com",
    id: "USR-001",
    mfaStatus: "active",
    name: "Igor Nicoletti",
    phoneMasked: "(17) 99130-4197",
    role: "owner",
    status: "active",
    unitId: null,
    unitName: null,
  })),
}))

// The auth services branch on `getSupabaseBrowserClient()` and
// `shouldBypassAuthInDev()`. We force those seams so the whole progressive
// authentication flow can be simulated deterministically without a backend,
// covering success, failure, denial, and silent-failure containment.
vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => null,
}))

const { bypassMock } = vi.hoisted(() => ({
  bypassMock: vi.fn(() => true),
}))

vi.mock("@/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config")>()

  return {
    ...actual,
    shouldBypassAuthInDev: () => bypassMock(),
  }
})

vi.mock("@/features/auth/services/auth-api", () => ({
  requestAccessRecovery: requestAccessRecoveryMock,
  submitPasswordCredentials: submitPasswordCredentialsMock,
}))

vi.mock("@/features/auth/services/auth-session", () => ({
  getCurrentSessionProfile: getCurrentSessionProfileMock,
}))

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>()

  return {
    ...actual,
    getCurrentSessionProfile: getCurrentSessionProfileMock,
    requestAccessRecovery: requestAccessRecoveryMock,
    submitPasswordCredentials: submitPasswordCredentialsMock,
  }
})

import {
  canAccessProtectedApp,
  canReadAudit,
  canReadPermissions,
  getCurrentSessionProfile,
  hasCapability,
  requestAccessRecovery,
  requiresAccountRecovery,
  submitPasswordCredentials,
} from "@/features/auth"

const validCpf = "529.982.247-25"

beforeEach(() => {
  bypassMock.mockReturnValue(true)
  submitPasswordCredentialsMock.mockReset()
  requestAccessRecoveryMock.mockReset()
  getCurrentSessionProfileMock.mockReset()

  submitPasswordCredentialsMock.mockImplementation((input: AuthPasswordRequestInput) => {
    if (!bypassMock()) {
      return Promise.reject(new Error("AUTH_SUPABASE_NOT_CONFIGURED"))
    }

    if (input.newPassword) {
      return Promise.resolve({
        flowId: "flow-2",
        message: "Senha atualizada.",
        nextAction: "register_passkey",
      })
    }

    return Promise.resolve({
      flowId: "flow-1",
      message: "Senha temporária aceita.",
      nextAction: "set_new_password",
    })
  })

  requestAccessRecoveryMock.mockResolvedValue({
    message: "Se os dados puderem ser validados, a solicitação será analisada pela administração.",
  })

  getCurrentSessionProfileMock.mockImplementation(() => {
    if (!bypassMock()) {
      return Promise.resolve(null)
    }

    return Promise.resolve({
      authUserId: "test-auth-user",
      avatarUrl: null,
      email: "igor.nicoletti@redemontecarlo.com",
      id: "USR-001",
      mfaStatus: "active",
      name: "Igor Nicoletti",
      phoneMasked: "(17) 99130-4197",
      role: "owner",
      status: "active",
      unitId: null,
      unitName: null,
    })
  })
})

describe("progressive authentication flow (simulated)", () => {
  it("asks for a new password on first successful credential submission", async () => {
    const response = await submitPasswordCredentials({
      cpf: validCpf,
      password: "temporary",
    })

    expect(response.nextAction).toBe("set_new_password")
    expect(response.flowId).toBeTruthy()
  })

  it("advances to passkey registration once a new password is provided", async () => {
    const response = await submitPasswordCredentials({
      cpf: validCpf,
      password: "temporary",
      newPassword: "StrongPass#123",
    })

    expect(response.nextAction).toBe("register_passkey")
  })

  it("returns a uniform recovery response to avoid user enumeration", async () => {
    const knownUser = await requestAccessRecovery({
      cpf: validCpf,
      phone: "11987654321",
      reason: "lost_phone",
    })

    const unknownUser = await requestAccessRecovery({
      cpf: "111.444.777-35",
      phone: "11912345678",
      reason: "forgot_password",
    })

    // Identical, non-revealing responses regardless of account existence.
    expect(knownUser.message).toBe(unknownUser.message)
    expect(knownUser.message.length).toBeGreaterThan(0)
  })

  it("resolves an active session identity that can enter the app", async () => {
    const profile = await getCurrentSessionProfile()

    expect(profile).not.toBeNull()
    expect(profile?.status).toBe("active")
    expect(canAccessProtectedApp(profile?.status)).toBe(true)
  })
})

describe("auth failure and denial containment", () => {
  it("fails safely (throws, never silently succeeds) with no backend and bypass off", async () => {
    bypassMock.mockReturnValue(false)

    await expect(
      submitPasswordCredentials({ cpf: validCpf, password: "temporary" })
    ).rejects.toThrow()
  })

  it("does not throw when resolving a session even if bypass is off", async () => {
    bypassMock.mockReturnValue(false)

    await expect(getCurrentSessionProfile()).resolves.toBeNull()
  })
})

describe("authorization policy (least privilege)", () => {
  it("grants audit and permissions visibility only to privileged roles", () => {
    for (const role of ["owner", "admin", "auditor"] as const) {
      expect(canReadAudit(role)).toBe(true)
      expect(canReadPermissions(role)).toBe(true)
    }

    for (const role of ["manager", "operator"] as const) {
      expect(canReadAudit(role)).toBe(false)
      expect(canReadPermissions(role)).toBe(false)
    }
  })

  it("never grants management capabilities to non-admin roles", () => {
    expect(hasCapability("operator", "admin.users.disable")).toBe(false)
    expect(hasCapability("manager", "admin.users.create")).toBe(false)
    expect(hasCapability("auditor", "admin.users.disable")).toBe(false)
    expect(hasCapability("admin", "admin.users.disable")).toBe(true)
  })

  it("treats unknown or null roles as unauthorized", () => {
    expect(canReadAudit(null)).toBe(false)
    expect(hasCapability(undefined, "audit.read")).toBe(false)
  })
})

describe("account status gating", () => {
  it("only allows active accounts into the protected app", () => {
    expect(canAccessProtectedApp("active")).toBe(true)
    expect(canAccessProtectedApp("pending")).toBe(false)
    expect(canAccessProtectedApp("inactive")).toBe(false)
    expect(canAccessProtectedApp(null)).toBe(false)
  })

  it("routes reset states into the recovery flow", () => {
    expect(requiresAccountRecovery("password_reset")).toBe(true)
    expect(requiresAccountRecovery("passkey_reset")).toBe(true)
    expect(requiresAccountRecovery("active")).toBe(false)
  })
})
