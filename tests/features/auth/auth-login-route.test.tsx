import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { appRoutePaths } from "@/app/router/route-registry"

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

vi.mock("@/features/auth/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/context")>()

  return {
    ...actual,
    useAuth: () => mocks.authContext,
  }
})

vi.mock("@/components/toast", () => ({
  notify: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

async function renderRoute() {
  const { AuthLoginRoute } = await import("@/features/auth/routes/auth-login-route")

  return render(
    <MemoryRouter initialEntries={[appRoutePaths.login]}>
      <Routes>
        <Route path={appRoutePaths.login} element={<AuthLoginRoute />} />
        <Route
          path={appRoutePaths.home}
          element={<h1>Área autenticada</h1>}
        />
      </Routes>
    </MemoryRouter>
  )
}

function submitCredentials() {
  fireEvent.change(screen.getByLabelText("CPF*"), {
    target: { value: "52998224725" },
  })
  fireEvent.change(screen.getByLabelText("Senha*"), {
    target: { value: "SenhaAtual@2026" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }))
}

describe("AuthLoginRoute", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.consumeExpired.mockReturnValue(false)
    mocks.authContext.isSubmitting = false
    mocks.authContext.passwordChange.required = false
  })

  it("shows only one acknowledgement action when the session expired", async () => {
    mocks.consumeExpired.mockReturnValue(true)

    await renderRoute()

    expect(screen.getByRole("heading", { name: "Sessão encerrada" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Entendi" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument()
  })

  it("completes the required password step and opens the authenticated route", async () => {
    mocks.authContext.actions.signInWithPassword.mockResolvedValueOnce({
      flowId: "password-flow",
      message: "Ação adicional necessária.",
      nextAction: "set_new_password",
    })
    mocks.authContext.actions.completeRequiredPassword.mockResolvedValueOnce({
      flowId: null,
      message: "Senha atualizada.",
      nextAction: "authenticated",
    })

    await renderRoute()
    submitCredentials()

    expect(await screen.findByText("Defina uma nova senha")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Nova senha*"), {
      target: { value: "NovaSenha@2026" },
    })
    fireEvent.change(screen.getByLabelText("Confirmar nova senha*"), {
      target: { value: "NovaSenha@2026" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }))

    await waitFor(() => {
      expect(
        mocks.authContext.actions.completeRequiredPassword
      ).toHaveBeenCalledWith("NovaSenha@2026")
    })

    expect(
      await screen.findByRole("heading", { name: "Área autenticada" })
    ).toBeInTheDocument()
  })

  it("keeps passkey optional after password authentication", async () => {
    mocks.authContext.actions.signInWithPassword.mockResolvedValueOnce({
      flowId: null,
      message: "Autenticado.",
      nextAction: "authenticated",
    })

    await renderRoute()
    submitCredentials()

    expect(
      await screen.findByRole("heading", { name: "Área autenticada" })
    ).toBeInTheDocument()
    expect(
      screen.queryByText("Cadastro de passkey necessário")
    ).not.toBeInTheDocument()
  })
})
