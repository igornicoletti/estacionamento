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
const registerAuthenticatedPasskey = vi.fn(() =>
  Promise.resolve({
    createdAt: null,
    friendlyName: null,
    id: "passkey-test",
  })
)
const signInWithPasskey = vi.fn()
const signInWithPassword = vi.fn(() =>
  Promise.resolve({
    flowId: null,
    message: "ok",
    nextAction: AUTH_NEXT_ACTION.authenticated,
  })
)
const getCurrentAuthProfile = vi.fn<() => Promise<AuthProfile | null>>()
let authStateChangeCallback: (() => void) | null = null
let currentAuth: AuthContextValue | null = null

const profile: AuthProfile = {
  authUserId: "auth-user-admin-test",
  avatarPath: null,
  avatarUrl: null,
  cpfMasked: "***.456.789-**",
  email: "admin.test@example.com",
  id: "app-user-admin-test",
  name: "Administrador Teste",
  passkeyStatus: "active",
  permissions: [AUTH_PERMISSION.all],
  phoneMasked: "(11) *****-0001",
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

async function flushMicrotasks(times = 5) {
  for (let index = 0; index < times; index += 1) {
    await Promise.resolve()
  }
}

function emitAuthStateChange() {
  authStateChangeCallback?.()
}

describe("AuthProvider inactivity", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
    window.sessionStorage.clear()
    signOutCurrentSession.mockClear()
    registerAuthenticatedPasskey.mockClear()
    signInWithPasskey.mockClear()
    signInWithPassword.mockClear()
    getCurrentAuthProfile.mockReset()
    authStateChangeCallback = null
    currentAuth = null

    vi.doMock("@/features/auth/api/auth-api", () => ({
      completeRequiredPassword: vi.fn(),
      getCurrentAuthProfile,
      registerAuthenticatedPasskey,
      signInWithPasskey,
      signInWithPassword,
      signOutCurrentSession,
      subscribeToAuthSessionChanges: vi.fn((callback: () => void) => {
        authStateChangeCallback = callback

        return () => {
          if (authStateChangeCallback === callback) {
            authStateChangeCallback = null
          }
        }
      }),
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
      emitAuthStateChange()
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
