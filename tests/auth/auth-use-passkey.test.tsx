import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const completePasskeyLogin = vi.fn()
const completePasskeyRegistration = vi.fn()
const registerPasskey = vi.fn()
const signInWithPasskey = vi.fn()
const signOutCurrentSession = vi.fn()

vi.mock("../../src/features/auth/services", () => ({
  completePasskeyLogin: (...args: unknown[]) => completePasskeyLogin(...args),
  completePasskeyRegistration: (...args: unknown[]) =>
    completePasskeyRegistration(...args),
  registerPasskey: (...args: unknown[]) => registerPasskey(...args),
  signInWithPasskey: (...args: unknown[]) => signInWithPasskey(...args),
}))

vi.mock("../../src/features/auth/services/auth-session", () => ({
  signOutCurrentSession: (...args: unknown[]) =>
    signOutCurrentSession(...args),
}))

import { usePasskey } from "@/features/auth/hooks/auth-use-passkey"

describe("usePasskey", () => {
  it("completes login without signing out when the app-side flow succeeds", async () => {
    signInWithPasskey.mockResolvedValueOnce(undefined)
    completePasskeyLogin.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => usePasskey())

    await act(async () => {
      await result.current.authenticate({ cpf: "12345678900", flowId: "flow-1" })
    })

    expect(signInWithPasskey).toHaveBeenCalledTimes(1)
    expect(completePasskeyLogin).toHaveBeenCalledWith({
      cpf: "12345678900",
      flowId: "flow-1",
    })
    expect(signOutCurrentSession).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(false)
  })

  it("signs out the stale WebAuthn session when app-side completion is rejected (e.g. inactive/pending account)", async () => {
    signInWithPasskey.mockResolvedValueOnce(undefined)
    const completionError = new Error("account not active")
    completePasskeyLogin.mockRejectedValueOnce(completionError)
    signOutCurrentSession.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => usePasskey())

    await expect(
      act(async () => {
        await result.current.authenticate({
          cpf: "12345678900",
          flowId: "flow-2",
        })
      })
    ).rejects.toThrow("account not active")

    expect(signInWithPasskey).toHaveBeenCalledTimes(1)
    expect(completePasskeyLogin).toHaveBeenCalledTimes(1)
    expect(signOutCurrentSession).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it("does not attempt sign-out when the WebAuthn ceremony itself fails before any session exists", async () => {
    const webauthnError = new Error("NotAllowedError")
    signInWithPasskey.mockRejectedValueOnce(webauthnError)

    const { result } = renderHook(() => usePasskey())

    await expect(
      act(async () => {
        await result.current.authenticate({
          cpf: "12345678900",
          flowId: "flow-3",
        })
      })
    ).rejects.toThrow("NotAllowedError")

    expect(completePasskeyLogin).not.toHaveBeenCalled()
    expect(signOutCurrentSession).not.toHaveBeenCalled()
  })
})
