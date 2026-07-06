const CRC32_POLYNOMIAL = 0xedb88320

const crc32Table = (() => {
  const table = new Uint32Array(256)

  for (let index = 0; index < 256; index += 1) {
    let value = index

    for (let bit = 0; bit < 8; bit += 1) {
      value =
        value & 1 ? CRC32_POLYNOMIAL ^ (value >>> 1) : value >>> 1
    }

    table[index] = value >>> 0
  }

  return table
})()

/**
 * Computes the CRC-32 checksum (IEEE 802.3, as required by the ZIP format)
 * for the provided bytes. Verified against the canonical check value
 * `crc32("123456789") === 0xCBF43926`.
 */
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff

  for (let index = 0; index < bytes.length; index += 1) {
    const tableIndex = (crc ^ bytes[index]) & 0xff
    crc = (crc >>> 8) ^ crc32Table[tableIndex]
  }

  return (crc ^ 0xffffffff) >>> 0
}
