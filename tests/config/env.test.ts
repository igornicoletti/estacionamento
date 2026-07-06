import { beforeEach, describe, expect, it, vi } from "vitest"

async function loadEnvModule() {
  return import("@/config/env")
}

describe("config/env", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv("VITE_SUPABASE_URL", "")
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
    vi.stubEnv("VITE_APP_ORIGIN", window.location.origin)
    vi.stubEnv("VITE_WEBAUTHN_RP_ID", window.location.hostname)
  })

  it("rejects partial Supabase config to avoid ambiguous local behavior", async () => {
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "")
    vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co")

    await expect(loadEnvModule()).rejects.toThrow("ENV_SUPABASE_CONFIG_PARTIAL")
  })

  it("rejects secret Supabase keys in client env without leaking raw value", async () => {
    const leakedValue = "sb_secret_super_sensitive_value"

    vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co")
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", leakedValue)

    await expect(loadEnvModule()).rejects.toThrow("ENV_SUPABASE_KEY_SECRET")

    try {
      await loadEnvModule()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : ""

      expect(message).not.toContain(leakedValue)
    }
  })

  it("rejects service-role JWTs in publishable key", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co")
    vi.stubEnv(
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "aaa.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.bbb"
    )

    await expect(loadEnvModule()).rejects.toThrow("ENV_SUPABASE_KEY_SERVICE_ROLE")
  })

  it("sanitizes invalid boolean env errors", async () => {
    vi.stubEnv("VITE_AUTH_DEV_BYPASS", "SECRET_INTERNAL_FLAG")

    try {
      await loadEnvModule()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : ""

      expect(message).toContain("ENV_BOOLEAN_INVALID")
      expect(message).not.toContain("SECRET_INTERNAL_FLAG")
      return
    }

    throw new Error("Expected env module import to fail")
  })

  it("uses predictable local defaults when optional env vars are absent", async () => {
    const mod = await loadEnvModule()

    expect(mod.shouldBypassAuthInDev()).toBe(false)
    expect(mod.env.appOrigin).toBe(window.location.origin)
    expect(mod.env.webauthnRpId).toBe(window.location.hostname)
  })
})
