import { describe, expect, it } from "vitest"

import { buildSourceHash } from "../../supabase/functions/clients-sync/source-hash"

describe("clients sync source hash", () => {
  it("produces a stable 128-bit hexadecimal fingerprint", () => {
    const parts = [42, "Cliente Monte Carlo", true, null]

    expect(buildSourceHash(parts)).toBe(buildSourceHash(parts))
    expect(buildSourceHash(parts)).toMatch(/^[0-9a-f]{32}$/)
  })

  it("preserves field boundaries and detects changed values", () => {
    expect(buildSourceHash(["ab", "c"])).not.toBe(buildSourceHash(["a", "bc"]))
    expect(buildSourceHash(["active"])).not.toBe(buildSourceHash(["inactive"]))
  })
})
