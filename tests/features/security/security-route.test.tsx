import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SecurityRoute } from "@/features/security/routes/security-route"

const mocks = vi.hoisted(() => {
  const registerProfilePasskey = vi.fn()
  const logoutAsync = vi.fn(() => Promise.resolve())
  const refreshProfile = vi.fn(() => Promise.resolve())
  const invoke = vi.fn()
  const getSession = vi.fn()

  const profile = {
    authUserId: "auth-user-security-test",
    avatarPath: null,
    avatarUrl: null,
    cpfMasked: "***.456.789-**",
    email: "admin.test@example.com",
    id: "app-user-security-test",
    name: "Administrador Teste",
    passkeyStatus: "active",
    permissions: ["*"],
    phoneMasked: "(11) *****-0001",
    role: {
      id: null,
      key: "owner",
      label: "Proprietário",
    },
    roleKey: "owner",
    status: "active",
    unitId: null,
    unitName: null,
  }

  const authContext = {
    access: {
      hasAllPermissions: () => true,
      hasAnyPermission: () => true,
      hasPermission: () => true,
      permissions: profile.permissions,
    },
    actions: {
      applyProfilePatch: vi.fn(),
      clearRequiredPasswordChallenge: vi.fn(),
      completeRequiredPassword: vi.fn(),
      logout: vi.fn(),
      logoutAsync,
      refreshProfile,
      registerProfilePasskey,
      registerRequiredPasskey: vi.fn(),
      signInWithPasskey: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    error: null,
    inactivity: {
      consumeExpired: () => false,
      continueSession: vi.fn(),
      isWarningOpen: false,
      markExpired: vi.fn(),
      secondsRemaining: 0,
    },
    isAuthenticated: true,
    isLoading: false,
    isSubmitting: false,
    passwordChange: {
      required: false,
    },
    profile,
    status: "authenticated",
  }

  const notifications = {
    data: [] as Array<{
      description: string
      href?: `/${string}`
      id: string
      occurredAt: string
      status: "read" | "unread"
      title: string
      type: "security" | "sync" | "system"
    }>,
    error: null,
    isLoading: false,
  }

  return {
    authContext,
    getSession,
    invoke,
    logoutAsync,
    notifications,
    profile,
    refreshProfile,
    registerProfilePasskey,
  }
})

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>()

  return {
    ...actual,
    useAuth: () => mocks.authContext,
  }
})

vi.mock("@/features/notifications", () => ({
  useNotifications: () => mocks.notifications,
}))

vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mocks.getSession,
    },
    functions: {
      invoke: mocks.invoke,
    },
  }),
}))

function renderRoute() {
  return render(
    <MemoryRouter>
      <SecurityRoute />
    </MemoryRouter>
  )
}

function resetProfile(overrides: Partial<typeof mocks.profile> = {}) {
  mocks.authContext.profile = {
    ...mocks.profile,
    ...overrides,
  }
  mocks.authContext.access.permissions = mocks.authContext.profile.permissions
}

describe("SecurityRoute", () => {
  beforeEach(() => {
    mocks.registerProfilePasskey.mockReset()
    mocks.registerProfilePasskey.mockResolvedValue({
      createdAt: "2026-07-20T12:00:00.000Z",
      friendlyName: "Passkey do teste",
      id: "passkey-test",
    })
    mocks.logoutAsync.mockClear()
    mocks.refreshProfile.mockClear()
    mocks.invoke.mockReset()
    mocks.invoke.mockResolvedValue({ data: {}, error: null })
    mocks.getSession.mockReset()
    mocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            app_metadata: {
              ip_address: "203.0.113.10",
            },
            last_sign_in_at: "2026-07-20T11:00:00.000Z",
          },
        },
      },
      error: null,
    })
    mocks.notifications.error = null
    mocks.notifications.isLoading = false
    mocks.notifications.data = [
      {
        description: "Uma atualização de segurança foi registrada na sua conta.",
        id: "N-SEC-002",
        occurredAt: "2026-07-20T12:00:00.000Z",
        status: "unread",
        title: "Passkey cadastrada",
        type: "security",
      },
      {
        description: "Clientes e unidades foram sincronizados.",
        id: "N-SYNC-001",
        occurredAt: "2026-07-20T10:00:00.000Z",
        status: "unread",
        title: "Sincronização concluída",
        type: "sync",
      },
      {
        description: "Uma nova tentativa de acesso foi registrada.",
        id: "N-SEC-001",
        occurredAt: "2026-07-20T09:00:00.000Z",
        status: "read",
        title: "Nova tentativa de acesso",
        type: "security",
      },
    ]
    resetProfile()
  })

  it("renders supported measures, full score and only security notifications", () => {
    renderRoute()

    expect(screen.getByRole("heading", { name: "Segurança" })).toBeInTheDocument()
    expect(screen.getByText("3 de 3 medidas suportadas concluídas")).toBeInTheDocument()
    expect(screen.getByText("Senha forte")).toBeInTheDocument()
    expect(screen.getByText("Passkey")).toBeInTheDocument()
    expect(screen.getByText("Contato de recuperação")).toBeInTheDocument()
    expect(screen.getByText("Passkey cadastrada")).toBeInTheDocument()
    expect(screen.getByText("Nova tentativa de acesso")).toBeInTheDocument()
    expect(screen.queryByText("Sincronização concluída")).not.toBeInTheDocument()

    expect(screen.getByText("Sessão atual")).toBeInTheDocument()
  })

  it("shows action-required measures when passkey and recovery contact are missing", () => {
    resetProfile({
      passkeyStatus: "inactive",
      phoneMasked: "",
      permissions: [],
    })

    renderRoute()

    expect(screen.getByText("1 de 3 medidas suportadas concluídas")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Cadastrar passkey/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Atualizar contato/i })).toBeInTheDocument()
    expect(screen.getByText("Nenhuma permissão explícita vinculada à sessão.")).toBeInTheDocument()
  })

  it("keeps passkey registration single-flight while the browser challenge is active", async () => {
    resetProfile({ passkeyStatus: "inactive" })

    let resolvePasskey!: (value: Awaited<ReturnType<typeof mocks.registerProfilePasskey>>) => void
    mocks.registerProfilePasskey.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePasskey = resolve
    }))

    renderRoute()

    const button = screen.getByRole("button", { name: /Cadastrar passkey/i })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(mocks.registerProfilePasskey).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolvePasskey({
        createdAt: "2026-07-20T12:00:00.000Z",
        friendlyName: "Passkey do teste",
        id: "passkey-test",
      })
      await Promise.resolve()
    })
  })

  it("changes password and clears the local auth session after success", async () => {
    renderRoute()

    fireEvent.click(screen.getByRole("button", { name: /Alterar senha/i }))

    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText(/Senha atual/i), {
      target: { value: "SenhaAtual123!" },
    })
    fireEvent.change(within(dialog).getByLabelText(/^Nova senha/i), {
      target: { value: "SenhaNova123!" },
    })
    fireEvent.change(within(dialog).getByLabelText(/^Confirme a nova senha/i), {
      target: { value: "SenhaNova123!" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Alterar senha" }))

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith("profile-change-password", {
        body: {
          currentPassword: "SenhaAtual123!",
          newPassword: "SenhaNova123!",
        },
      })
      expect(mocks.logoutAsync).toHaveBeenCalledTimes(1)
    })
  })
})
