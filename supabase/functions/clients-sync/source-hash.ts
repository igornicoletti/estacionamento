/**
 * Fast, deterministic 128-bit fingerprint for change detection.
 *
 * This is intentionally non-cryptographic: source hashes are not credentials or
 * integrity proofs. Keeping the work synchronous avoids one Web Crypto operation
 * per ERP row and stays within the Edge Runtime CPU budget.
 */
export function buildSourceHash(parts: readonly unknown[]) {
  const input = parts
    .map((part) => {
      const value = String(part ?? "")
      return `${value.length}:${value}`
    })
    .join("|")

  let h1 = 1_779_033_703
  let h2 = 3_144_134_277
  let h3 = 1_013_904_242
  let h4 = 2_773_480_762

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index)
    h1 = h2 ^ Math.imul(h1 ^ code, 597_399_067)
    h2 = h3 ^ Math.imul(h2 ^ code, 2_869_860_233)
    h3 = h4 ^ Math.imul(h3 ^ code, 951_274_213)
    h4 = h1 ^ Math.imul(h4 ^ code, 2_716_044_179)
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597_399_067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2_869_860_233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951_274_213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2_716_044_179)

  h1 ^= h2 ^ h3 ^ h4
  h2 ^= h1
  h3 ^= h1
  h4 ^= h1

  return [h1, h2, h3, h4]
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("")
}
