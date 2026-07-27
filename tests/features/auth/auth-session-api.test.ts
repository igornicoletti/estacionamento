import { beforeEach, describe, expect, it, vi } from "vitest"

const rpc = vi.fn()
const signOut = vi.fn()

describe("auth session api", () => {
  beforeEach(() => {
    vi.resetModules()
    rpc.mockReset()
    signOut.mockReset()

    vi.doMock("@/lib", () => ({
      getSupabaseBrowserClient: () => ({
        auth: { signOut },
        rpc,
      }),
    }))

    vi.doMock("@/features/auth/constants", () => ({
      authCopy: {
        errors: {
          logoutFailed: "Falha ao sair.",
          sessionLoadFailed: "Falha ao carregar a sessão.",
          unavailable: "Autenticação indisponível.",
        },
        inactivity: {
          expiredDescription: "A sessão expirou.",
        },
      },
    }))
  })

  it("maps an active server lease", async () => {
    rpc.mockResolvedValueOnce({
      data: [{
        absolute_expires_at: "2026-07-28T12:00:00.000Z",
        enforcement_enabled: true,
        idle_expires_at: "2026-07-27T12:45:00.000Z",
        server_time: "2026-07-27T12:00:00.000Z",
        status: "active",
      }],
      error: null,
    })
    const { touchCurrentAuthSession } = await import(
      "@/features/auth/api/auth-session-api"
    )

    await expect(touchCurrentAuthSession()).resolves.toEqual({
      absoluteExpiresAt: "2026-07-28T12:00:00.000Z",
      enforcementEnabled: true,
      idleExpiresAt: "2026-07-27T12:45:00.000Z",
      serverTime: "2026-07-27T12:00:00.000Z",
      status: "active",
    })
    expect(rpc).toHaveBeenCalledWith("touch_current_auth_session", {
      p_activity_observed: false,
    })
  })

  it("reports observed activity explicitly to the server lease", async () => {
    rpc.mockResolvedValueOnce({
      data: [{
        absolute_expires_at: null,
        enforcement_enabled: false,
        idle_expires_at: null,
        server_time: "2026-07-27T12:00:00.000Z",
        status: "active",
      }],
      error: null,
    })
    const { touchCurrentAuthSession } = await import(
      "@/features/auth/api/auth-session-api"
    )

    await touchCurrentAuthSession({ activityObserved: true })

    expect(rpc).toHaveBeenCalledWith("touch_current_auth_session", {
      p_activity_observed: true,
    })
  })

  it("revokes the application lease before local sign-out", async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null })
    signOut.mockResolvedValueOnce({ data: null, error: null })
    const { signOutCurrentSession } = await import(
      "@/features/auth/api/auth-session-api"
    )

    await signOutCurrentSession()

    expect(rpc).toHaveBeenCalledWith("revoke_current_auth_session", {
      p_reason: "logout",
    })
    expect(signOut).toHaveBeenCalledWith({ scope: "local" })
  })
})
