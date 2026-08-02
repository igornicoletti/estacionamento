import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { notify } from "@/components/toast"
import { SecurityRoute } from "@/features/security/routes/security-route"

const mocks = vi.hoisted(() => {
  const registerProfilePasskey = vi.fn()
  const logoutAsync = vi.fn(() => Promise.resolve())
  const refreshProfile = vi.fn(() => Promise.resolve())
  const invoke = vi.fn()
  const getSession = vi.fn()
  const rpc = vi.fn()
  const mfaChallengeAndVerify = vi.fn()
  const mfaEnroll = vi.fn()
  const mfaUnenroll = vi.fn()

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

  return {
    authContext,
    getSession,
    invoke,
    logoutAsync,
    mfaChallengeAndVerify,
    mfaEnroll,
    mfaUnenroll,
    profile,
    refreshProfile,
    registerProfilePasskey,
    rpc,
  }
})

vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>()

  return {
    ...actual,
    useAuth: () => mocks.authContext,
  }
})

vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mocks.getSession,
      mfa: {
        challengeAndVerify: mocks.mfaChallengeAndVerify,
        enroll: mocks.mfaEnroll,
        unenroll: mocks.mfaUnenroll,
      },
    },
    functions: {
      invoke: mocks.invoke,
    },
    rpc: mocks.rpc,
  }),
}))

const defaultPosture = {
  currentLevel: "aal1",
  currentSessionTrusted: false,
  mfaConfigured: true,
  recentLoginsReviewed: false,
  sessions: [
    {
      aal: "aal1",
      createdAt: "2026-07-20T11:00:00.000Z",
      current: true,
      ipAddress: "203.0.113.10",
      lastSeenAt: "2026-07-20T12:00:00.000Z",
      reviewed: false,
      trusted: false,
      userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/126.0",
    },
  ],
  trustedDevicesConfigured: false,
}

const auditEventRows = [
  {
    event_code: "password_changed",
    event_id: "00000000-0000-4000-8000-000000000001",
    occurred_at: "2026-07-20T12:00:00.000Z",
    severity: "info",
    success: true,
  },
  {
    event_code: "passkey_registered",
    event_id: "00000000-0000-4000-8000-000000000002",
    occurred_at: "2026-07-20T11:00:00.000Z",
    severity: "info",
    success: true,
  },
  {
    event_code: "profile_updated",
    event_id: "00000000-0000-4000-8000-000000000003",
    occurred_at: "2026-07-20T10:00:00.000Z",
    severity: "info",
    success: true,
  },
  {
    event_code: "security_logins_reviewed",
    event_id: "00000000-0000-4000-8000-000000000004",
    occurred_at: "2026-07-20T09:00:00.000Z",
    severity: "info",
    success: true,
  },
  {
    event_code: "security_device_trusted",
    event_id: "00000000-0000-4000-8000-000000000005",
    occurred_at: "2026-07-20T08:00:00.000Z",
    severity: "info",
    success: true,
  },
] as const
let currentPosture = structuredClone(defaultPosture)

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
    mocks.mfaChallengeAndVerify.mockReset()
    mocks.mfaChallengeAndVerify.mockResolvedValue({ data: {}, error: null })
    mocks.mfaEnroll.mockReset()
    mocks.mfaEnroll.mockResolvedValue({
      data: {
        id: "factor-1",
        totp: {
          qr_code: "data:image/svg+xml,qr",
          secret: "SECRET123",
        },
      },
      error: null,
    })
    mocks.mfaUnenroll.mockReset()
    mocks.mfaUnenroll.mockResolvedValue({ data: {}, error: null })
    currentPosture = structuredClone(defaultPosture)
    mocks.rpc.mockReset()
    mocks.rpc.mockImplementation((functionName: string) => {
      if (functionName === "get_current_security_posture") {
        return Promise.resolve({ data: currentPosture, error: null })
      }

      if (functionName === "get_current_security_events") {
        return Promise.resolve({ data: auditEventRows, error: null })
      }

      return Promise.resolve({
        data: "2026-07-20T12:00:00.000Z",
        error: null,
      })
    })
    resetProfile()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the six security measures and user-scoped audit events", async () => {
    const { container } = renderRoute()

    await waitFor(() => {
      expect(mocks.getSession).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByRole("heading", { name: "Segurança" })).toBeInTheDocument()
    expect(screen.getByText("4 de 6 medidas de segurança concluídas")).toBeInTheDocument()
    expect(
      screen.getByRole("progressbar", { name: "Pontuação de segurança: 67 de 100" })
    ).toHaveAttribute("data-score-tone", "warning")
    expect(screen.getByText("Autenticação de dois fatores")).toBeInTheDocument()
    expect(screen.getByText("Senha forte")).toBeInTheDocument()
    expect(screen.getByText("Chave de acesso inscrita")).toBeInTheDocument()
    expect(screen.getByText("Opções de recuperação configuradas")).toBeInTheDocument()
    expect(screen.getByText("Logins recentes revisados")).toBeInTheDocument()
    expect(screen.getByText("Dispositivos confiáveis configurados")).toBeInTheDocument()
    expect(screen.getByText("Senha alterada")).toBeInTheDocument()
    expect(screen.getByText("Chave de acesso configurada")).toBeInTheDocument()
    expect(screen.queryByText("Perfil atualizado")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Ver todos os 5" }))
    expect(screen.getByText("Perfil atualizado")).toBeInTheDocument()
    expect(screen.getByText("Logins revisados")).toBeInTheDocument()
    expect(screen.getByText("Dispositivo confiável")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ver menos" })).toBeInTheDocument()

    expect(screen.queryByText("Feito")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trocar senha" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Configurar chave de acesso" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Revisar logins" })).toBeInTheDocument()
    expect(screen.getAllByRole("alert")).toHaveLength(2)
    expect(screen.getByText("Verifique a atividade da conta")).toBeInTheDocument()
    expect(screen.getByText("Use somente dispositivos confiáveis")).toBeInTheDocument()
    expect(screen.queryByText("O que são chaves de acesso?")).not.toBeInTheDocument()
    const cards = container.querySelectorAll('[data-slot="card"]')
    expect(cards).toHaveLength(1)
    expect(cards[0]?.querySelectorAll('[data-slot="separator"]')).toHaveLength(2)
    expect(
      container.querySelector('[data-security-list="measures"]')
    ).toHaveClass("gap-5!")
    expect(
      container.querySelector('[data-security-list="events"]')
    ).toHaveClass("gap-5!")
  })

  it("shows action-required measures when passkey and recovery contact are missing", async () => {
    resetProfile({
      passkeyStatus: "inactive",
      phoneMasked: "",
      permissions: [],
    })

    renderRoute()

    await waitFor(() => {
      expect(mocks.getSession).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText("2 de 6 medidas de segurança concluídas")).toBeInTheDocument()
    expect(
      screen.getByRole("progressbar", { name: "Pontuação de segurança: 33 de 100" })
    ).toHaveAttribute("data-score-tone", "error")
    expect(
      screen.getByRole("button", { name: "Configurar chave de acesso" })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Configurar recuperação/i })).toBeInTheDocument()
    expect(screen.getAllByRole("alert")).toHaveLength(4)
    expect(screen.getByText("O que são chaves de acesso?")).toBeInTheDocument()
    expect(screen.getByText("Mantenha os contatos atualizados")).toBeInTheDocument()
  })

  it("keeps passkey registration single-flight while the browser challenge is active", async () => {
    resetProfile({ passkeyStatus: "inactive" })

    let resolvePasskey!: (value: Awaited<ReturnType<typeof mocks.registerProfilePasskey>>) => void
    mocks.registerProfilePasskey.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePasskey = resolve
    }))

    renderRoute()

    const button = screen.getByRole("button", { name: "Configurar chave de acesso" })
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

    fireEvent.click(screen.getByRole("button", { name: "Trocar senha" }))

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
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }))

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

  it("preserves password whitespace exactly as entered", async () => {
    renderRoute()

    fireEvent.click(await screen.findByRole("button", { name: "Trocar senha" }))

    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText(/Senha atual/i), {
      target: { value: " SenhaAtual123! " },
    })
    fireEvent.change(within(dialog).getByLabelText(/^Nova senha/i), {
      target: { value: " SenhaNova123! " },
    })
    fireEvent.change(within(dialog).getByLabelText(/^Confirme a nova senha/i), {
      target: { value: " SenhaNova123! " },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith("profile-change-password", {
        body: {
          currentPassword: " SenhaAtual123! ",
          newPassword: " SenhaNova123! ",
        },
      })
    })
  })

  it("reviews recent logins through the protected RPC", async () => {
    currentPosture = {
      ...structuredClone(defaultPosture),
      sessions: [
        {
          ...defaultPosture.sessions[0],
          createdAt: "2026-07-20T08:00:00.000Z",
          current: false,
          lastSeenAt: "2026-07-20T09:00:00.000Z",
          userAgent: "Mozilla/5.0 (Windows NT 10.0) Firefox/126.0",
        },
        {
          ...defaultPosture.sessions[0],
          lastSeenAt: "2026-07-20T13:00:00.000Z",
        },
      ],
    }
    renderRoute()

    fireEvent.click(
      await screen.findByRole("button", { name: "Revisar logins" })
    )
    const dialog = screen.getByRole("dialog", { name: "Revisar logins recentes" })
    expect(
      within(dialog)
        .getAllByText(/Google Chrome|Mozilla Firefox/)
        .map((element) => element.textContent)
    ).toEqual([
      "Google Chrome · Windows",
      "Mozilla Firefox · Windows",
    ])
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Revisar" })
    )

    await waitFor(() => {
      expect(mocks.rpc).toHaveBeenCalledWith("review_current_security_logins")
    })
  })

  it("trusts the current device through the AAL2-protected RPC", async () => {
    renderRoute()

    fireEvent.click(
      await screen.findByRole("button", { name: "Confiar neste dispositivo" })
    )

    await waitFor(() => {
      expect(mocks.rpc).toHaveBeenCalledWith("trust_current_security_device")
    })
  })

  it("shows information instead of an error when MFA is not configured", async () => {
    currentPosture = {
      ...structuredClone(defaultPosture),
      mfaConfigured: false,
    }
    const infoSpy = vi.spyOn(notify, "info").mockReturnValue("mfa-required")

    renderRoute()
    fireEvent.click(
      await screen.findByRole("button", { name: "Confiar neste dispositivo" })
    )

    expect(infoSpy).toHaveBeenCalledWith(
      "Configure a autenticação de dois fatores primeiro."
    )
    expect(mocks.rpc).not.toHaveBeenCalledWith("trust_current_security_device")
  })

  it("enrolls and verifies an authenticator app", async () => {
    currentPosture = {
      ...structuredClone(defaultPosture),
      mfaConfigured: false,
    }
    renderRoute()

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Configurar autenticação de dois fatores",
      })
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Autenticação de dois fatores",
    })
    expect(mocks.mfaEnroll).not.toHaveBeenCalled()
    expect(within(dialog).getByRole("button", { name: /SMS/ })).toBeDisabled()
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Continuar" })).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: /Aplicativo/ })
    ).toHaveAttribute("aria-pressed", "true")

    expect(mocks.mfaEnroll).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }))

    expect(
      await within(dialog).findByRole("img", {
        name: "QR Code para configurar o aplicativo autenticador",
      })
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Copiar chave" })).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "Continuar" }))

    expect(within(dialog).getByLabelText("Código de verificação")).toHaveAttribute(
      "aria-invalid",
      "false"
    )
    expect(
      within(dialog).getByText(
        "Digite o código de 6 dígitos exibido no aplicativo autenticador."
      )
    ).toHaveClass("text-balance")
    expect(
      dialog.querySelectorAll('[data-slot="input-otp-slot"][aria-invalid="true"]')
    ).toHaveLength(0)
    fireEvent.click(within(dialog).getByRole("button", { name: "Habilitar" }))
    expect(within(dialog).getByLabelText("Código de verificação")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(
      within(dialog).getByText("Informe os 6 dígitos do aplicativo.")
    ).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText("Código de verificação"), {
      target: { value: "123456" },
    })
    expect(within(dialog).getByLabelText("Código de verificação")).toHaveAttribute(
      "aria-invalid",
      "false"
    )
    fireEvent.click(within(dialog).getByRole("button", { name: "Habilitar" }))

    await waitFor(() => {
      expect(mocks.mfaChallengeAndVerify).toHaveBeenCalledWith({
        factorId: "factor-1",
        code: "123456",
      })
    })
  })
})
