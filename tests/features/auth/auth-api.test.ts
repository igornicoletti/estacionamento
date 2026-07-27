import { beforeEach, describe, expect, it, vi } from "vitest"

function enablePasskeySupport() {
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: true,
  })
  Object.defineProperty(window, "PublicKeyCredential", {
    configurable: true,
    value: function PublicKeyCredential() {},
  })
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: {},
  })
}

function createSupabaseMock() {
  const functionsInvoke = vi.fn(
    (_name: string, _options?: unknown): Promise<{ data: unknown; error: null }> =>
      Promise.resolve({
        data: { ok: true },
        error: null,
      })
  )
  const signInWithPasskey = vi.fn<
    () => Promise<{
      data: {
        session: { access_token: string } | null
        user: { id: string } | null
      }
      error: null
    }>
  >()
  const setSession = vi.fn((_session: unknown) => Promise.resolve({ error: null }))
  const getValidatedSupabaseAccessToken = vi.fn<
    (_client: unknown) => Promise<string | null>
  >()
  const supabase = {
    auth: {
      setSession,
      signInWithPasskey,
    },
    functions: {
      invoke: functionsInvoke,
    },
  }

  return {
    functionsInvoke,
    getValidatedSupabaseAccessToken,
    setSession,
    signInWithPasskey,
    supabase,
  }
}

async function importAuthApiWithSupabase(
  mock: ReturnType<typeof createSupabaseMock>
) {
  vi.doMock("@/lib", () => ({
    getSupabaseBrowserClient: () => mock.supabase,
    getValidatedSupabaseAccessToken: mock.getValidatedSupabaseAccessToken,
    resolveVisibleSensitiveValue: (value: string | null) => value,
  }))

  return import("@/features/auth/api/auth-api")
}

describe("auth api", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    enablePasskeySupport()
  })

  it("normalizes the legacy required-passkey response as authenticated", async () => {
    const mock = createSupabaseMock()
    mock.functionsInvoke.mockResolvedValueOnce({
      data: {
        flowId: "legacy-flow",
        message: "Legacy response",
        nextAction: "register_passkey",
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      },
      error: null,
    })
    const { signInWithPassword } = await importAuthApiWithSupabase(mock)

    const response = await signInWithPassword({
      cpf: "12345678909",
      password: "Password!123",
    })

    expect(response.nextAction).toBe("authenticated")
    expect(mock.setSession).toHaveBeenCalledWith({
      access_token: "access-token",
      refresh_token: "refresh-token",
    })
  })

  it("registers passkey login audit with the returned authenticated session", async () => {
    const mock = createSupabaseMock()
    mock.signInWithPasskey.mockResolvedValue({
      data: {
        session: {
          access_token: "passkey-session-token",
        },
        user: {
          id: "auth-user-1",
        },
      },
      error: null,
    })
    const { signInWithPasskey } = await importAuthApiWithSupabase(mock)

    await signInWithPasskey()

    expect(mock.getValidatedSupabaseAccessToken).not.toHaveBeenCalled()
    expect(mock.functionsInvoke).toHaveBeenCalledWith("auth-passkey-login", {
      body: {},
      headers: {
        Authorization: "Bearer passkey-session-token",
      },
    })
  })

  it("skips passkey login audit when no authenticated token is available", async () => {
    const mock = createSupabaseMock()
    mock.signInWithPasskey.mockResolvedValue({
      data: {
        session: null,
        user: null,
      },
      error: null,
    })
    mock.getValidatedSupabaseAccessToken.mockResolvedValue(null)
    const { signInWithPasskey } = await importAuthApiWithSupabase(mock)

    await signInWithPasskey()

    expect(mock.getValidatedSupabaseAccessToken).toHaveBeenCalledWith(mock.supabase)
    expect(mock.functionsInvoke).not.toHaveBeenCalled()
  })
})
