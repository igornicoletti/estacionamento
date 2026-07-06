import { describe, expect, it } from "vitest"

import {
  columnLetter,
  crc32,
  createXlsxBytes,
  createZipArchive,
  sanitizeSheetName,
} from "@/lib/export"

const textEncoder = new TextEncoder()

function bytesOf(value: string) {
  return textEncoder.encode(value)
}

describe("crc32", () => {
  it("matches the canonical ZIP/IEEE check value", () => {
    // The universally documented CRC-32 check value for "123456789".
    expect(crc32(bytesOf("123456789"))).toBe(0xcbf43926)
  })

  it("returns 0 for empty input", () => {
    expect(crc32(new Uint8Array(0))).toBe(0)
  })

  it("is stable for a known ASCII phrase", () => {
    expect(crc32(bytesOf("The quick brown fox jumps over the lazy dog"))).toBe(
      0x414fa339
    )
  })
})

describe("createZipArchive", () => {
  it("produces a container starting with the local file header signature", () => {
    const archive = createZipArchive([
      { name: "hello.txt", data: bytesOf("hello world") },
    ])

    // PK\x03\x04
    expect(Array.from(archive.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04])
  })

  it("ends with the end-of-central-directory signature", () => {
    const archive = createZipArchive([
      { name: "a.txt", data: bytesOf("a") },
      { name: "b.txt", data: bytesOf("b") },
    ])

    const tail = archive.slice(archive.length - 22, archive.length - 18)

    // PK\x05\x06
    expect(Array.from(tail)).toEqual([0x50, 0x4b, 0x05, 0x06])
  })

  it("records the correct number of entries in the central directory", () => {
    const archive = createZipArchive([
      { name: "a.txt", data: bytesOf("a") },
      { name: "b.txt", data: bytesOf("b") },
      { name: "c.txt", data: bytesOf("c") },
    ])

    const view = new DataView(
      archive.buffer,
      archive.byteOffset,
      archive.byteLength
    )
    const entriesOnDisk = view.getUint16(archive.length - 22 + 8, true)
    const totalEntries = view.getUint16(archive.length - 22 + 10, true)

    expect(entriesOnDisk).toBe(3)
    expect(totalEntries).toBe(3)
  })
})

describe("columnLetter", () => {
  it("maps zero-based indices to spreadsheet column letters", () => {
    expect(columnLetter(0)).toBe("A")
    expect(columnLetter(25)).toBe("Z")
    expect(columnLetter(26)).toBe("AA")
    expect(columnLetter(701)).toBe("ZZ")
    expect(columnLetter(702)).toBe("AAA")
  })
})

describe("sanitizeSheetName", () => {
  it("strips forbidden characters and truncates to 31 chars", () => {
    expect(sanitizeSheetName("Rel:/atório?*[teste]", "Fallback")).toBe(
      "Rel atório teste"
    )
    expect(
      sanitizeSheetName("x".repeat(40), "Fallback").length
    ).toBe(31)
    expect(sanitizeSheetName("   ", "Fallback")).toBe("Fallback")
  })
})

describe("createXlsxBytes", () => {
  it("packages a valid xlsx (zip) with the workbook parts", () => {
    const bytes = createXlsxBytes([
      {
        name: "Dados",
        columns: [
          { header: "Nome", accessor: (row: { name: string; age: number }) => row.name },
          { header: "Idade", accessor: (row) => row.age },
        ],
        rows: [
          { name: "Ana", age: 30 },
          { name: "Beto <b>", age: 41 },
        ],
      },
    ])

    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04])

    const asText = new TextDecoder().decode(bytes)
    expect(asText).toContain("[Content_Types].xml")
    expect(asText).toContain("xl/workbook.xml")
    expect(asText).toContain("xl/worksheets/sheet1.xml")
    // Inline string content is XML-escaped.
    expect(asText).toContain("Beto &lt;b&gt;")
    // Numeric cells are typed as numbers.
    expect(asText).toContain('t="n"><v>30</v>')
  })

  it("throws when no sheets are provided", () => {
    expect(() => createXlsxBytes([])).toThrow()
  })
})
