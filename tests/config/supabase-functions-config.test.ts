import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function readSupabaseConfig() {
  return readFileSync(join(process.cwd(), "supabase", "config.toml"), "utf8")
}

function readEnvExample() {
  return readFileSync(join(process.cwd(), ".env.example"), "utf8")
}

function readCorsHelper() {
  return readFileSync(
    join(process.cwd(), "supabase", "functions", "_shared", "auth-cors.ts"),
    "utf8"
  )
}

function expectFunctionVerifyJwt(config: string, functionName: string, expected: boolean) {
  const section = new RegExp(
    String.raw`\[functions\.${functionName}\]\s+verify_jwt\s*=\s*${String(expected)}`,
    "m"
  )

  expect(config).toMatch(section)
}

function readTomlString(config: string, key: string) {
  const match = config.match(new RegExp(String.raw`^${key}\s*=\s*"([^"]+)"`, "m"))

  return match?.[1] ?? null
}

function readEnvValue(env: string, key: string) {
  const match = env.match(new RegExp(String.raw`^${key}=([^\r\n]+)`, "m"))

  return match?.[1]?.trim() ?? null
}

describe("Supabase Edge Function auth config", () => {
  it("keeps pre-session auth functions callable with a publishable key", () => {
    const config = readSupabaseConfig()

    expectFunctionVerifyJwt(config, "auth-password", false)
    expectFunctionVerifyJwt(config, "auth-recovery-request", false)
    expectFunctionVerifyJwt(config, "auth-passkey-login", false)
    expectFunctionVerifyJwt(config, "clients-sync", false)
    expectFunctionVerifyJwt(config, "units-sync", false)
  })

  it("keeps administrative functions protected by user JWT verification", () => {
    const config = readSupabaseConfig()

    for (const functionName of [
      "admin-recovery-review",
      "admin-user-auth-factors",
      "admin-user-block",
      "admin-user-clear-lock",
      "admin-user-create",
      "admin-user-reset-passkey",
      "admin-user-reset-password",
      "admin-user-revoke-sessions",
      "admin-user-update",
      "auth-complete-passkey",
      "auth-register-passkey",
      "list-permission-matrix",
      "profile-change-password",
      "profile-update",
    ]) {
      expectFunctionVerifyJwt(config, functionName, true)
    }
  })

  it("documents development and production app origins in Edge Function CORS origins", () => {
    const config = readSupabaseConfig()
    const envExample = readEnvExample()
    const siteUrl = readTomlString(config, "site_url")
    const allowedOrigins = readEnvValue(envExample, "APP_ALLOWED_ORIGINS")
    const origins = allowedOrigins?.split(",") ?? []

    expect(siteUrl).toBeTruthy()
    expect(origins).toEqual(
      expect.arrayContaining([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://estacionamento-livid.vercel.app",
        "https://estacionamento.redemontecarlo.com.br",
      ])
    )
    expect(origins).toContain(siteUrl)
  })

  it("keeps browser CORS headers aligned with supabase-js requests", () => {
    const corsHelper = readCorsHelper()

    for (const headerName of [
      "authorization",
      "x-client-info",
      "apikey",
      "content-type",
    ]) {
      expect(corsHelper).toContain(`"${headerName}"`)
    }

    expect(corsHelper).toContain("\"Access-Control-Max-Age\": \"86400\"")
    expect(corsHelper).not.toContain("x-app-session")
  })
})
