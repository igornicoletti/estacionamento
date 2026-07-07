import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const passkeyMocks = vi.hoisted(() => ({
  completePasskeyLogin: vi.fn<() => Promise<void>>(),
  completePasskeyRegistration: vi.fn<() => Promise<void>>(),
  registerPasskey: vi.fn<() => Promise<void>>(),
  signInWithPasskey: vi.fn<() => Promise<void>>(),
  signOutCurrentSession: vi.fn<() => Promise<void>>(),
}))

vi.mock("@/features/auth/services/auth-api", () => ({
  completePasskeyLogin: passkeyMocks.completePasskeyLogin,
  completePasskeyRegistration: passkeyMocks.completePasskeyRegistration,
}))

vi.mock("@/features/auth/services/auth-passkey-client", () => ({
  registerPasskey: passkeyMocks.registerPasskey,
  signInWithPasskey: passkeyMocks.signInWithPasskey,
}))

vi.mock("@/features/auth/services/auth-session", () => ({
  signOutCurrentSession: passkeyMocks.signOutCurrentSession,
}))

import { usePasskey } from "@/features/auth/hooks/auth-use-passkey"

describe("usePasskey", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("completes login without signing out when the app-side flow succeeds", async () => {
    passkeyMocks.signInWithPasskey.mockResolvedValueOnce(undefined)
    passkeyMocks.completePasskeyLogin.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => usePasskey())

    await act(async () => {
      await result.current.authenticate({ cpf: "12345678900", flowId: "flow-1" })
    })

    expect(passkeyMocks.signInWithPasskey).toHaveBeenCalledTimes(1)
    expect(passkeyMocks.completePasskeyLogin).toHaveBeenCalledWith({
      cpf: "12345678900",
      flowId: "flow-1",
    })
    expect(passkeyMocks.signOutCurrentSession).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(false)
  })

  it("signs out the stale WebAuthn session when app-side completion is rejected (e.g. inactive/pending account)", async () => {
    passkeyMocks.signInWithPasskey.mockResolvedValueOnce(undefined)
    const completionError = new Error("account not active")
    passkeyMocks.completePasskeyLogin.mockRejectedValueOnce(completionError)
    passkeyMocks.signOutCurrentSession.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => usePasskey())

    await expect(
      act(async () => {
        await result.current.authenticate({
          cpf: "12345678900",
          flowId: "flow-2",
        })
      })
    ).rejects.toThrow("account not active")

    expect(passkeyMocks.signInWithPasskey).toHaveBeenCalledTimes(1)
    expect(passkeyMocks.completePasskeyLogin).toHaveBeenCalledTimes(1)
    expect(passkeyMocks.signOutCurrentSession).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it("does not attempt sign-out when the WebAuthn ceremony itself fails before any session exists", async () => {
    const webauthnError = new Error("NotAllowedError")
    passkeyMocks.signInWithPasskey.mockRejectedValueOnce(webauthnError)

    const { result } = renderHook(() => usePasskey())

    await expect(
      act(async () => {
        await result.current.authenticate({
          cpf: "12345678900",
          flowId: "flow-3",
        })
      })
    ).rejects.toThrow("NotAllowedError")

    expect(passkeyMocks.completePasskeyLogin).not.toHaveBeenCalled()
    expect(passkeyMocks.signOutCurrentSession).not.toHaveBeenCalled()
  })
})
