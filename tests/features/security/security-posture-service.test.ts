import { beforeEach, describe, expect, it, vi } from "vitest"

const supabaseMock = vi.hoisted(() => ({
  challengeAndVerify: vi.fn(),
  enroll: vi.fn(),
  rpc: vi.fn(),
  unenroll: vi.fn(),
}))

function importService() {
  vi.doMock("@/lib/supabase-browser", () => ({
    getSupabaseBrowserClient: () => ({
      auth: {
        mfa: {
          challengeAndVerify: supabaseMock.challengeAndVerify,
          enroll: supabaseMock.enroll,
          unenroll: supabaseMock.unenroll,
        },
      },
      rpc: supabaseMock.rpc,
    }),
  }))

  return import("@/features/security/services/security-posture-service")
}

const posturePayload = {
  currentLevel: "aal2",
  currentSessionTrusted: false,
  mfaConfigured: true,
  recentLoginsReviewed: false,
  sessions: [
    {
      aal: "aal2",
      createdAt: "2026-08-01T10:00:00.000Z",
      current: true,
      ipAddress: "203.0.113.10",
      lastSeenAt: "2026-08-01T11:00:00.000Z",
      reviewed: false,
      trusted: false,
      userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/126.0",
    },
  ],
  trustedDevicesConfigured: false,
} as const

describe("security posture service", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("validates and maps the current security posture", async () => {
    supabaseMock.rpc.mockResolvedValue({ data: posturePayload, error: null })
    const { getSecurityPosture } = await importService()

    await expect(getSecurityPosture()).resolves.toMatchObject({
      currentLevel: "aal2",
      sessions: [
        expect.objectContaining({
          browser: "Google Chrome",
          operatingSystem: "Windows",
        }),
      ],
    })
  })

  it("fails closed when the posture payload is invalid", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: { ...posturePayload, currentLevel: "aal3" },
      error: null,
    })
    const { getSecurityPosture } = await importService()

    await expect(getSecurityPosture()).rejects.toThrow(
      "As configurações de segurança retornaram dados inválidos."
    )
  })

  it("calls the user-scoped review and trust RPCs", async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: "2026-08-01T12:00:00.000Z",
      error: null,
    })
    const {
      reviewRecentSecurityLogins,
      trustCurrentSecurityDevice,
    } = await importService()

    await reviewRecentSecurityLogins()
    await trustCurrentSecurityDevice()

    expect(supabaseMock.rpc).toHaveBeenNthCalledWith(
      1,
      "review_current_security_logins"
    )
    expect(supabaseMock.rpc).toHaveBeenNthCalledWith(
      2,
      "trust_current_security_device"
    )
  })

  it("enrolls and verifies a TOTP factor", async () => {
    supabaseMock.enroll.mockResolvedValue({
      data: {
        id: "factor-1",
        totp: {
          qr_code: "data:image/svg+xml,qr",
          secret: "SECRET123",
        },
      },
      error: null,
    })
    supabaseMock.challengeAndVerify.mockResolvedValue({ data: {}, error: null })
    supabaseMock.rpc.mockResolvedValue({
      data: "2026-08-01T12:00:00.000Z",
      error: null,
    })
    const { enrollSecurityTotp, verifySecurityTotp } = await importService()

    const enrollment = await enrollSecurityTotp()
    await verifySecurityTotp(enrollment.factorId, "123456")

    expect(enrollment).toEqual({
      factorId: "factor-1",
      qrCode: "data:image/svg+xml,qr",
      secret: "SECRET123",
    })
    expect(supabaseMock.challengeAndVerify).toHaveBeenCalledWith({
      factorId: "factor-1",
      code: "123456",
    })
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      "record_current_security_mfa_enabled"
    )
  })
})
