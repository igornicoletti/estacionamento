import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function readSupabaseConfig() {
  return readFileSync(join(process.cwd(), "supabase", "config.toml"), "utf8")
}

function expectFunctionVerifyJwt(config: string, functionName: string, expected: boolean) {
  const section = new RegExp(
    String.raw`\[functions\.${functionName}\]\s+verify_jwt\s*=\s*${String(expected)}`,
    "m"
  )

  expect(config).toMatch(section)
}

describe("Supabase Edge Function auth config", () => {
  it("keeps pre-session auth functions callable with a publishable key", () => {
    const config = readSupabaseConfig()

    expectFunctionVerifyJwt(config, "auth-password", false)
    expectFunctionVerifyJwt(config, "auth-recovery-request", false)
  })
})
