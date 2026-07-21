import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const consumeExpired = vi.fn(() => true)

  const authContext = {
    access: {
      hasAllPermissions: () => true,
      hasAnyPermission: () => true,
      hasPermission: () => true,
      permissions: ["*"],
    },
    actions: {
      applyProfilePatch: vi.fn(),
      clearRequiredPasswordChallenge: vi.fn(),
      completeRequiredPassword: vi.fn(),
      logout: vi.fn(),
      logoutAsync: vi.fn(),
      refreshProfile: vi.fn(),
      registerProfilePasskey: vi.fn(),
      registerRequiredPasskey: vi.fn(),
      signInWithPasskey: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    error: null,
    inactivity: {
      consumeExpired,
      continueSession: vi.fn(),
      isWarningOpen: false,
      markExpired: vi.fn(),
      secondsRemaining: 0,
    },
    isAuthenticated: false,
    isLoading: false,
    isSubmitting: false,
    passwordChange: {
      required: false,
    },
    profile: null,
    status: "anonymous",
  }

  return {
    authContext,
    consumeExpired,
  }
})

vi.mock("@/features/auth", async () => {
  const contracts = await import("@/features/auth/contracts")

  return {
    ...contracts,
    useAuth: () => mocks.authContext,
  }
})

async function renderRoute() {
  const { AuthLoginRoute } = await import("@/features/auth/routes/auth-login-route")

  return render(
    <MemoryRouter>
      <AuthLoginRoute />
    </MemoryRouter>
  )
}

describe("AuthLoginRoute", () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.consumeExpired.mockReturnValue(true)
  })

  it("shows only one acknowledgement action when the session expired", async () => {
    await renderRoute()

    expect(screen.getByRole("heading", { name: "Sessão encerrada" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Entendi" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument()
  })
})
