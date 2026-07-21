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
  const functionsInvoke = vi.fn(() =>
    Promise.resolve({
      data: { ok: true },
      error: null,
    })
  )
  const signInWithPasskey = vi.fn()
  const getValidatedSupabaseAccessToken = vi.fn()
  const supabase = {
    auth: {
      signInWithPasskey,
    },
    functions: {
      invoke: functionsInvoke,
    },
  }

  return {
    functionsInvoke,
    getValidatedSupabaseAccessToken,
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
