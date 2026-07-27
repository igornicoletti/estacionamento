import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  AUTH_INACTIVITY,
  AUTH_SESSION_TIMEOUTS,
} from "@/features/auth/contracts/auth-contracts"

function readSupabaseConfig() {
  return readFileSync(join(process.cwd(), "supabase", "config.toml"), "utf8")
}

function readTomlValue(config: string, key: string) {
  const match = new RegExp(`^${key}\\s*=\\s*"?([^"\\n]+)"?`, "m").exec(
    config
  )

  return match?.[1] ?? null
}

describe("auth session configuration", () => {
  it("keeps paid Supabase timeouts disabled and the application lease explicit", () => {
    const config = readSupabaseConfig()

    expect(readTomlValue(config, "inactivity_timeout")).toBe("0s")
    expect(readTomlValue(config, "timebox")).toBe("0s")
    expect(readTomlValue(config, "jwt_expiry")).toBe(
      String(AUTH_SESSION_TIMEOUTS.jwtExpirySeconds)
    )
    expect(AUTH_SESSION_TIMEOUTS.inactivityMinutes).toBe(45)
    expect(AUTH_SESSION_TIMEOUTS.timeboxHours).toBe(24)
    expect(AUTH_INACTIVITY.timeoutMs).toBe(
      AUTH_SESSION_TIMEOUTS.inactivityMinutes * 60 * 1000
    )
    expect(AUTH_INACTIVITY.heartbeatMs).toBe(30_000)
  })
})
