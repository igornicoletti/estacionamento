import { crc32 } from "./crc32"

interface ZipEntry {
  /** Path within the archive, using forward slashes (e.g. `xl/workbook.xml`). */
  name: string
  /** Raw file contents. */
  data: Uint8Array
}

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50
const ZIP_VERSION = 20
const STORE_COMPRESSION = 0

const textEncoder = new TextEncoder()

function encodeName(name: string): Uint8Array {
  return textEncoder.encode(name)
}

/**
 * Builds a valid ZIP archive using the STORE method (no compression). This is
 * intentionally dependency-free and deterministic so it can be unit-tested and
 * shipped to production without a bundled compression library. The output is a
 * spec-compliant ZIP container, which is exactly what an `.xlsx` package is.
 */
export function createZipArchive(entries: readonly ZipEntry[]): Uint8Array {
  const encodedEntries = entries.map((entry) => {
    const nameBytes = encodeName(entry.name)

    return {
      nameBytes,
      data: entry.data,
      crc: crc32(entry.data),
    }
  })

  const localHeaderSize = 30
  const centralHeaderSize = 46
  const endOfCentralDirectorySize = 22

  let localSectionSize = 0
  let centralSectionSize = 0

  for (const entry of encodedEntries) {
    localSectionSize += localHeaderSize + entry.nameBytes.length + entry.data.length
    centralSectionSize += centralHeaderSize + entry.nameBytes.length
  }

  const totalSize =
    localSectionSize + centralSectionSize + endOfCentralDirectorySize

  const buffer = new Uint8Array(totalSize)
  const view = new DataView(buffer.buffer)

  let offset = 0
  const centralDirectoryOffsets: number[] = []

  for (const entry of encodedEntries) {
    centralDirectoryOffsets.push(offset)

    view.setUint32(offset, LOCAL_FILE_HEADER_SIGNATURE, true)
    view.setUint16(offset + 4, ZIP_VERSION, true)
    view.setUint16(offset + 6, 0, true)
    view.setUint16(offset + 8, STORE_COMPRESSION, true)
    view.setUint16(offset + 10, 0, true)
    view.setUint16(offset + 12, 0, true)
    view.setUint32(offset + 14, entry.crc, true)
    view.setUint32(offset + 18, entry.data.length, true)
    view.setUint32(offset + 22, entry.data.length, true)
    view.setUint16(offset + 26, entry.nameBytes.length, true)
    view.setUint16(offset + 28, 0, true)

    offset += localHeaderSize
    buffer.set(entry.nameBytes, offset)
    offset += entry.nameBytes.length
    buffer.set(entry.data, offset)
    offset += entry.data.length
  }

  const centralDirectoryStart = offset

  encodedEntries.forEach((entry, index) => {
    view.setUint32(offset, CENTRAL_DIRECTORY_SIGNATURE, true)
    view.setUint16(offset + 4, ZIP_VERSION, true)
    view.setUint16(offset + 6, ZIP_VERSION, true)
    view.setUint16(offset + 8, 0, true)
    view.setUint16(offset + 10, STORE_COMPRESSION, true)
    view.setUint16(offset + 12, 0, true)
    view.setUint16(offset + 14, 0, true)
    view.setUint32(offset + 16, entry.crc, true)
    view.setUint32(offset + 20, entry.data.length, true)
    view.setUint32(offset + 24, entry.data.length, true)
    view.setUint16(offset + 28, entry.nameBytes.length, true)
    view.setUint16(offset + 30, 0, true)
    view.setUint16(offset + 32, 0, true)
    view.setUint16(offset + 34, 0, true)
    view.setUint16(offset + 36, 0, true)
    view.setUint32(offset + 38, 0, true)
    view.setUint32(offset + 42, centralDirectoryOffsets[index], true)

    offset += centralHeaderSize
    buffer.set(entry.nameBytes, offset)
    offset += entry.nameBytes.length
  })

  const centralDirectorySize = offset - centralDirectoryStart

  view.setUint32(offset, END_OF_CENTRAL_DIRECTORY_SIGNATURE, true)
  view.setUint16(offset + 4, 0, true)
  view.setUint16(offset + 6, 0, true)
  view.setUint16(offset + 8, encodedEntries.length, true)
  view.setUint16(offset + 10, encodedEntries.length, true)
  view.setUint32(offset + 12, centralDirectorySize, true)
  view.setUint32(offset + 16, centralDirectoryStart, true)
  view.setUint16(offset + 20, 0, true)

  return buffer
}

export type { ZipEntry }
