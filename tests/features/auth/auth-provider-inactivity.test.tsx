import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  AUTH_INACTIVITY,
  AUTH_NEXT_ACTION,
  AUTH_PERMISSION,
  AUTH_ROLE_KEY,
  AUTH_STATUS,
} from "@/features/auth/contracts/auth-contracts"
import type { AuthContextValue } from "@/features/auth/context/auth-provider"
import type { AuthProfile } from "@/features/auth/types/auth-types"

const signOutCurrentSession = vi.fn(() => Promise.resolve())
const registerCurrentPasskey = vi.fn()
const signInWithPasskey = vi.fn()
const signInWithPassword = vi.fn(() =>
  Promise.resolve({
    flowId: null,
    message: "ok",
    nextAction: AUTH_NEXT_ACTION.authenticated,
    profile: null,
  })
)
const getCurrentAuthProfile = vi.fn<() => Promise<AuthProfile | null>>()

const profile: AuthProfile = {
  authUserId: "auth-user-igor",
  avatarPath: null,
  avatarUrl: null,
  cpfMasked: "***.982.247-**",
  email: "igor.nicoletti@redemontecarlo.com",
  id: "app-user-igor",
  name: "Igor Nicoletti",
  passkeyStatus: "active",
  permissions: [AUTH_PERMISSION.all],
  phoneMasked: "(17) *****-4197",
  role: {
    id: null,
    key: AUTH_ROLE_KEY.owner,
    label: "Proprietário",
  },
  roleKey: AUTH_ROLE_KEY.owner,
  status: AUTH_STATUS.active,
  unitId: null,
  unitName: null,
}

let currentAuth: AuthContextValue | null = null

async function flushMicrotasks(times = 5) {
  for (let index = 0; index < times; index += 1) {
    await Promise.resolve()
  }
}

describe("AuthProvider inactivity", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
    window.sessionStorage.clear()
    signOutCurrentSession.mockClear()
    registerCurrentPasskey.mockClear()
    signInWithPasskey.mockClear()
    signInWithPassword.mockClear()
    getCurrentAuthProfile.mockReset()
    currentAuth = null

    vi.doMock("@/features/auth/api/auth-api", () => ({
      completeRequiredPassword: vi.fn(),
      getCurrentAuthProfile,
      registerCurrentPasskey,
      signInWithPasskey,
      signInWithPassword,
      signOutCurrentSession,
      subscribeToAuthSessionChanges: vi.fn(() => () => undefined),
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    window.sessionStorage.clear()
  })

  it("resets inactivity when login happens after the login screen was idle", async () => {
    const { AuthProvider, useAuth } = await import(
      "@/features/auth/context/auth-provider"
    )

    function Harness() {
      const auth = useAuth()
      currentAuth = auth

      return <output aria-label="status">{auth.status}</output>
    }

    getCurrentAuthProfile
      .mockResolvedValueOnce(null)
      .mockResolvedValue(profile)

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    )

    await act(async () => {
      await flushMicrotasks()
    })
    expect(screen.getByLabelText("status")).toHaveTextContent("anonymous")

    act(() => {
      vi.advanceTimersByTime(AUTH_INACTIVITY.timeoutMs + AUTH_INACTIVITY.tickMs)
    })

    await act(async () => {
      await currentAuth?.actions.signInWithPassword({
        cpf: "52998224725",
        password: "Senha@12345",
      })
      await flushMicrotasks()
    })
    expect(signInWithPassword).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText("status")).toHaveTextContent("authenticated")

    act(() => {
      vi.advanceTimersByTime(AUTH_INACTIVITY.tickMs)
    })

    expect(signOutCurrentSession).not.toHaveBeenCalled()
    expect(screen.getByLabelText("status")).toHaveTextContent("authenticated")
  })
})
