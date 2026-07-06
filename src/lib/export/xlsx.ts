import { createZipArchive, type ZipEntry } from "./zip"

export type XlsxCellValue = string | number | boolean | null | undefined

export interface XlsxColumn<TRow> {
  header: string
  /** Extracts the raw cell value for a given row. */
  accessor: (row: TRow) => XlsxCellValue
}

export interface XlsxSheet<TRow> {
  name: string
  columns: readonly XlsxColumn<TRow>[]
  rows: readonly TRow[]
}

const textEncoder = new TextEncoder()

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

function encode(content: string): Uint8Array {
  return textEncoder.encode(content)
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Excel worksheet names cannot exceed 31 characters and cannot contain any of
 * the characters `: \ / ? * [ ]`.
 */
function sanitizeSheetName(name: string, fallback: string): string {
  const normalized = name
    .replace(/[:\\/?*[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return (normalized || fallback).slice(0, 31)
}

function columnLetter(index: number): string {
  let dividend = index + 1
  let letter = ""

  while (dividend > 0) {
    const remainder = (dividend - 1) % 26
    letter = String.fromCharCode(65 + remainder) + letter
    dividend = Math.floor((dividend - 1) / 26)
  }

  return letter
}

function isNumericValue(value: XlsxCellValue): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function renderCell(
  value: XlsxCellValue,
  reference: string
): string {
  if (isNumericValue(value)) {
    return `<c r="${reference}" t="n"><v>${value}</v></c>`
  }

  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "boolean"
        ? value
          ? "Sim"
          : "Não"
        : value

  if (text === "") {
    return `<c r="${reference}"/>`
  }

  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(text))}</t></is></c>`
}

function renderRow(
  values: readonly XlsxCellValue[],
  rowIndex: number
): string {
  const cells = values
    .map((value, columnIndex) =>
      renderCell(value, `${columnLetter(columnIndex)}${rowIndex}`)
    )
    .join("")

  return `<row r="${rowIndex}">${cells}</row>`
}

function renderWorksheet<TRow>(sheet: XlsxSheet<TRow>): string {
  const headerRow = renderRow(
    sheet.columns.map((column) => column.header),
    1
  )

  const bodyRows = sheet.rows
    .map((row, index) =>
      renderRow(
        sheet.columns.map((column) => column.accessor(row)),
        index + 2
      )
    )
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${headerRow}${bodyRows}</sheetData></worksheet>`
}

function renderContentTypes(sheetCount: number): string {
  const overrides = Array.from(
    { length: sheetCount },
    (_unused, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}</Types>`
}

function renderRootRelationships(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
}

function renderWorkbook(sheetNames: readonly string[]): string {
  const sheets = sheetNames
    .map(
      (name, index) =>
        `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    )
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets}</sheets></workbook>`
}

function renderWorkbookRelationships(sheetCount: number): string {
  const relationships = Array.from(
    { length: sheetCount },
    (_unused, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`
}

/**
 * Serializes one or more sheets into a spec-compliant `.xlsx` package and
 * returns the raw bytes. Kept side-effect free so it is fully unit-testable.
 */
export function createXlsxBytes<TRow>(
  sheets: readonly XlsxSheet<TRow>[]
): Uint8Array {
  if (sheets.length === 0) {
    throw new Error("Ao menos uma planilha é necessária para exportar.")
  }

  const usedNames = new Set<string>()
  const sheetNames = sheets.map((sheet, index) => {
    let name = sanitizeSheetName(sheet.name, `Planilha${index + 1}`)
    let suffix = 1

    while (usedNames.has(name.toLowerCase())) {
      const base = name.slice(0, 28)
      name = `${base}_${suffix}`
      suffix += 1
    }

    usedNames.add(name.toLowerCase())
    return name
  })

  const entries: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: encode(renderContentTypes(sheets.length)),
    },
    { name: "_rels/.rels", data: encode(renderRootRelationships()) },
    { name: "xl/workbook.xml", data: encode(renderWorkbook(sheetNames)) },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: encode(renderWorkbookRelationships(sheets.length)),
    },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: encode(renderWorksheet(sheet)),
    })),
  ]

  return createZipArchive(entries)
}

/**
 * Serializes sheets into an `.xlsx` [Blob], ready to be handed to a download
 * helper or an upload API.
 */
export function createXlsxBlob<TRow>(sheets: readonly XlsxSheet<TRow>[]): Blob {
  const bytes = createXlsxBytes(sheets)

  return new Blob([bytes as BlobPart], { type: XLSX_CONTENT_TYPE })
}

export { XLSX_CONTENT_TYPE, columnLetter, escapeXml, sanitizeSheetName }
